import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const cryptoApi = {
  getPrices: async (limit = 20) => {
    const response = await axios.get(`${API}/crypto/prices?limit=${limit}`);
    return response.data;
  },

  getSinglePrice: async (coinId) => {
    const response = await axios.get(`${API}/crypto/price/${coinId}`);
    return response.data;
  },

  getChartData: async (coinId, days = 7) => {
    const response = await axios.get(`${API}/crypto/chart/${coinId}?days=${days}`);
    return response.data;
  },

  getWallet: async () => {
    const response = await axios.get(`${API}/wallet`);
    return response.data;
  },

  buyTrading: async (cryptoSymbol, amount, priceUsd) => {
    const response = await axios.post(`${API}/trade/buy`, {
      crypto_symbol: cryptoSymbol,
      amount,
      price_usd: priceUsd
    });
    return response.data;
  },

  sellTrading: async (cryptoSymbol, amount, priceUsd) => {
    const response = await axios.post(`${API}/trade/sell`, {
      crypto_symbol: cryptoSymbol,
      amount,
      price_usd: priceUsd
    });
    return response.data;
  },

  depositFunds: async (amount, paymentMethod) => {
    const response = await axios.post(`${API}/wallet/deposit`, {
      amount,
      payment_method: paymentMethod
    });
    return response.data;
  },

  withdrawFunds: async (amount, paymentMethod) => {
    const response = await axios.post(`${API}/wallet/withdraw`, {
      amount,
      payment_method: paymentMethod
    });
    return response.data;
  },

  getTransactions: async (limit = 50) => {
    const response = await axios.get(`${API}/transactions?limit=${limit}`);
    return response.data;
  }
};

export default cryptoApi;