const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://elmes-titulaire-back.onrender.com/api';

export const apiConfig = {
  baseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
};
