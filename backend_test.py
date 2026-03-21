import requests
import sys
import json
from datetime import datetime
import time

class NovaDexAPITester:
    def __init__(self, base_url="https://nexus-trade-6.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Unexpected error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_user_data = {
            "email": f"test_user_{timestamp}@novadex.com",
            "password": "TestPassword123!",
            "full_name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.test_email = test_user_data['email']
            self.test_password = test_user_data['password']
            return True
        return False

    def test_user_login(self):
        """Test user login with registered credentials"""
        if not hasattr(self, 'test_email'):
            self.log_test("User Login", False, "No registered user to test login")
            return False
            
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_crypto_prices(self):
        """Test getting crypto prices"""
        return self.run_test("Get Crypto Prices", "GET", "crypto/prices?limit=10", 200)

    def test_single_crypto_price(self):
        """Test getting single crypto price (Bitcoin)"""
        return self.run_test("Get Bitcoin Price", "GET", "crypto/price/bitcoin", 200)

    def test_chart_data(self):
        """Test getting chart data"""
        return self.run_test("Get Chart Data", "GET", "crypto/chart/bitcoin?days=7", 200)

    def test_wallet_access(self):
        """Test wallet access (requires authentication)"""
        if not self.token:
            self.log_test("Wallet Access", False, "No authentication token")
            return False
            
        success, response = self.run_test("Get Wallet", "GET", "wallet", 200)
        
        if success and 'balances' in response:
            # Check if user starts with $10,000 USD
            usd_balance = response['balances'].get('USD', 0)
            if usd_balance == 10000.0:
                self.log_test("Initial USD Balance Check", True)
            else:
                self.log_test("Initial USD Balance Check", False, f"Expected 10000, got {usd_balance}")
            return True
        return False

    def test_buy_crypto(self):
        """Test buying cryptocurrency (0.001 BTC)"""
        if not self.token:
            self.log_test("Buy Crypto", False, "No authentication token")
            return False

        # First get current Bitcoin price
        price_success, price_response = self.run_test("Get BTC Price for Trade", "GET", "crypto/price/bitcoin", 200)
        
        if not price_success:
            return False
            
        btc_price = price_response.get('price_usd', 50000)  # fallback price
        
        trade_data = {
            "crypto_symbol": "BTC",
            "amount": 0.001,
            "price_usd": btc_price
        }
        
        return self.run_test("Buy 0.001 BTC", "POST", "trade/buy", 200, data=trade_data)

    def test_transactions_history(self):
        """Test getting transaction history"""
        if not self.token:
            self.log_test("Transaction History", False, "No authentication token")
            return False
            
        return self.run_test("Get Transactions", "GET", "transactions?limit=20", 200)

    def test_sell_crypto(self):
        """Test selling cryptocurrency"""
        if not self.token:
            self.log_test("Sell Crypto", False, "No authentication token")
            return False

        # First get current Bitcoin price
        price_success, price_response = self.run_test("Get BTC Price for Sell", "GET", "crypto/price/bitcoin", 200)
        
        if not price_success:
            return False
            
        btc_price = price_response.get('price_usd', 50000)
        
        trade_data = {
            "crypto_symbol": "BTC",
            "amount": 0.0005,  # Sell half of what we bought
            "price_usd": btc_price
        }
        
        return self.run_test("Sell 0.0005 BTC", "POST", "trade/sell", 200, data=trade_data)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "invalid@test.com",
            "password": "wrongpassword"
        }
        
        return self.run_test("Invalid Login", "POST", "auth/login", 401, data=invalid_data)

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, _ = self.run_test("Unauthorized Wallet Access", "GET", "wallet", 401)
        
        # Restore token
        self.token = temp_token
        return success

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting NovaDex API Testing...")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)

        # Test sequence
        test_sequence = [
            self.test_root_endpoint,
            self.test_crypto_prices,
            self.test_single_crypto_price,
            self.test_chart_data,
            self.test_user_registration,
            self.test_user_login,
            self.test_wallet_access,
            self.test_buy_crypto,
            self.test_transactions_history,
            self.test_sell_crypto,
            self.test_invalid_login,
            self.test_unauthorized_access
        ]

        for test_func in test_sequence:
            try:
                test_func()
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                self.log_test(test_func.__name__, False, f"Test execution error: {str(e)}")

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n🔍 FAILED TESTS:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['details']}")

        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = NovaDexAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())