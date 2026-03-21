from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from pycoingecko import CoinGeckoAPI
import redis.asyncio as redis
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Redis for caching
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

# CoinGecko API - using demo key
cg = CoinGeckoAPI(demo_api_key=os.environ['COINGECKO_API_KEY'])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

security = HTTPBearer()

# Create the main app
app = FastAPI(title="NovaDex API")
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    full_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class CryptoPrice(BaseModel):
    coin_id: str
    symbol: str
    name: str
    current_price: float
    price_change_24h: float
    market_cap: float
    volume_24h: float

class WalletBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    balances: Dict[str, float] = Field(default_factory=dict)
    total_value_usd: float = 0.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TradeRequest(BaseModel):
    crypto_symbol: str
    amount: float
    price_usd: float

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # buy or sell
    crypto_symbol: str
    amount: float
    price_usd: float
    total_usd: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create initial wallet with 10000 USD
    wallet = WalletBalance(
        user_id=user.id,
        balances={"USD": 10000.0},
        total_value_usd=10000.0
    )
    wallet_doc = wallet.model_dump()
    wallet_doc['updated_at'] = wallet_doc['updated_at'].isoformat()
    await db.wallets.insert_one(wallet_doc)
    
    # Generate token
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    
    return TokenResponse(access_token=access_token, user=user)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc or not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(
        id=user_doc['id'],
        email=user_doc['email'],
        full_name=user_doc['full_name'],
        created_at=datetime.fromisoformat(user_doc['created_at']) if isinstance(user_doc['created_at'], str) else user_doc['created_at']
    )
    
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    
    return TokenResponse(access_token=access_token, user=user)

# Crypto endpoints
@api_router.get("/crypto/prices", response_model=List[CryptoPrice])
async def get_crypto_prices(limit: int = 20):
    cache_key = f"prices:{limit}"
    
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            data = json.loads(cached)
            return data
    except:
        pass
    
    try:
        data = cg.get_coins_markets(
            vs_currency='usd',
            order='market_cap_desc',
            per_page=limit,
            page=1,
            sparkline=False,
            price_change_percentage='24h'
        )
        
        result = [
            CryptoPrice(
                coin_id=coin['id'],
                symbol=coin['symbol'].upper(),
                name=coin['name'],
                current_price=coin['current_price'],
                price_change_24h=coin.get('price_change_percentage_24h', 0),
                market_cap=coin['market_cap'],
                volume_24h=coin['total_volume']
            )
            for coin in data
        ]
        
        try:
            await redis_client.setex(cache_key, 60, json.dumps([r.model_dump() for r in result]))
        except:
            pass
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch prices: {str(e)}")

@api_router.get("/crypto/price/{coin_id}")
async def get_single_price(coin_id: str):
    cache_key = f"price:{coin_id}"
    
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except:
        pass
    
    try:
        data = cg.get_price(
            ids=coin_id,
            vs_currencies='usd',
            include_24hr_change=True,
            include_market_cap=True,
            include_24hr_vol=True
        )
        
        if coin_id not in data:
            raise HTTPException(status_code=404, detail="Cryptocurrency not found")
        
        result = {
            "coin_id": coin_id,
            "price_usd": data[coin_id]['usd'],
            "price_change_24h": data[coin_id].get('usd_24h_change', 0),
            "market_cap": data[coin_id].get('usd_market_cap', 0),
            "volume_24h": data[coin_id].get('usd_24h_vol', 0)
        }
        
        try:
            await redis_client.setex(cache_key, 30, json.dumps(result))
        except:
            pass
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API Error: {str(e)}")

@api_router.get("/crypto/chart/{coin_id}")
async def get_chart_data(coin_id: str, days: int = 7):
    cache_key = f"chart:{coin_id}:{days}"
    
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except:
        pass
    
    try:
        data = cg.get_coin_market_chart_by_id(
            id=coin_id,
            vs_currency='usd',
            days=days
        )
        
        result = {
            "coin_id": coin_id,
            "days": days,
            "prices": data['prices']
        }
        
        try:
            await redis_client.setex(cache_key, 300, json.dumps(result))
        except:
            pass
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart: {str(e)}")

# Wallet endpoints
@api_router.get("/wallet", response_model=WalletBalance)
async def get_wallet(current_user: dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"user_id": current_user['id']}, {"_id": 0})
    if not wallet:
        # Create initial wallet
        wallet = WalletBalance(
            user_id=current_user['id'],
            balances={"USD": 10000.0},
            total_value_usd=10000.0
        )
        wallet_doc = wallet.model_dump()
        wallet_doc['updated_at'] = wallet_doc['updated_at'].isoformat()
        await db.wallets.insert_one(wallet_doc)
        return wallet
    
    if isinstance(wallet['updated_at'], str):
        wallet['updated_at'] = datetime.fromisoformat(wallet['updated_at'])
    
    return WalletBalance(**wallet)

# Trade endpoints
@api_router.post("/trade/buy", response_model=Transaction)
async def buy_crypto(trade: TradeRequest, current_user: dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"user_id": current_user['id']})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    total_cost = trade.amount * trade.price_usd
    usd_balance = wallet['balances'].get('USD', 0)
    
    if usd_balance < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient USD balance")
    
    # Update balances
    wallet['balances']['USD'] = usd_balance - total_cost
    current_crypto = wallet['balances'].get(trade.crypto_symbol, 0)
    wallet['balances'][trade.crypto_symbol] = current_crypto + trade.amount
    wallet['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.wallets.update_one(
        {"user_id": current_user['id']},
        {"$set": {"balances": wallet['balances'], "updated_at": wallet['updated_at']}}
    )
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user['id'],
        type="buy",
        crypto_symbol=trade.crypto_symbol,
        amount=trade.amount,
        price_usd=trade.price_usd,
        total_usd=total_cost
    )
    
    tx_doc = transaction.model_dump()
    tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return transaction

@api_router.post("/trade/sell", response_model=Transaction)
async def sell_crypto(trade: TradeRequest, current_user: dict = Depends(get_current_user)):
    wallet = await db.wallets.find_one({"user_id": current_user['id']})
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    crypto_balance = wallet['balances'].get(trade.crypto_symbol, 0)
    
    if crypto_balance < trade.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient {trade.crypto_symbol} balance")
    
    total_received = trade.amount * trade.price_usd
    
    # Update balances
    wallet['balances'][trade.crypto_symbol] = crypto_balance - trade.amount
    usd_balance = wallet['balances'].get('USD', 0)
    wallet['balances']['USD'] = usd_balance + total_received
    wallet['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.wallets.update_one(
        {"user_id": current_user['id']},
        {"$set": {"balances": wallet['balances'], "updated_at": wallet['updated_at']}}
    )
    
    # Create transaction
    transaction = Transaction(
        user_id=current_user['id'],
        type="sell",
        crypto_symbol=trade.crypto_symbol,
        amount=trade.amount,
        price_usd=trade.price_usd,
        total_usd=total_received
    )
    
    tx_doc = transaction.model_dump()
    tx_doc['timestamp'] = tx_doc['timestamp'].isoformat()
    await db.transactions.insert_one(tx_doc)
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user), limit: int = 50):
    transactions = await db.transactions.find(
        {"user_id": current_user['id']},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for tx in transactions:
        if isinstance(tx['timestamp'], str):
            tx['timestamp'] = datetime.fromisoformat(tx['timestamp'])
    
    return transactions

@api_router.get("/")
async def root():
    return {"message": "NovaDex API - Crypto Trading Platform"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await redis_client.close()