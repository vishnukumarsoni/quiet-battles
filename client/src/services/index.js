import { api } from './api';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const del = (url, params) => api.delete(url, { params }).then((r) => r.data);

const crud = (base) => ({
  list: (params) => get(base, params),
  get: (id, params) => get(`${base}/${id}`, params),
  create: (body) => post(base, body),
  update: (id, body) => put(`${base}/${id}`, body),
  remove: (id) => del(`${base}/${id}`),
});

export const seriesApi = crud('/series');
export const chaptersApi = crud('/chapters');
export const productsApi = crud('/products');

export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  changePassword: (currentPassword, newPassword) => put('/auth/password', { currentPassword, newPassword }),
};

export const cartApi = { validate: (items) => post('/cart/validate', { items }) };

export const ordersApi = {
  create: (body) => post('/orders', body),
  list: (params) => get('/orders', params),
  update: (id, body) => put(`/orders/${id}`, body),
};

export const mediaApi = {
  list: (params) => get('/upload', params),
  upload: (files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append('images', f));
    return api.post('/upload', form).then((r) => r.data);
  },
  replace: (id, file) => {
    const form = new FormData();
    form.append('image', file);
    return api.put(`/upload/${id}`, form).then((r) => r.data);
  },
  remove: (id, force = false) => del(`/upload/${id}`, force ? { force: true } : undefined),
};

export const settingsApi = { get: () => get('/settings'), update: (body) => put('/settings', body) };
export const adminApi = { stats: () => get('/admin/stats') };
export const formsApi = {
  contact: (body) => post('/contact', body),
  subscribe: (email) => post('/newsletter', { email }),
  messages: (params) => get('/contact', params),
  markRead: (id, isRead) => put(`/contact/${id}/read`, { isRead }),
  removeMessage: (id) => del(`/contact/${id}`),
  subscribers: (params) => get('/newsletter', params),
  removeSubscriber: (id) => del(`/newsletter/${id}`),
};
