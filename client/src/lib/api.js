import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

/** Fetch all posts sorted by position */
export const getPosts = () => api.get('/posts').then((r) => r.data);

/** Create a new post (multipart/form-data) */
export const createPost = (formData) =>
  api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Update an existing post (multipart/form-data) */
export const updatePost = (id, formData) =>
  api.put(`/posts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

/** Bulk reorder: [{ id, position }, ...] */
export const reorderPosts = (updates) =>
  api.put('/posts/reorder', updates, {
    headers: { 'Content-Type': 'application/json' },
  }).then((r) => r.data);

/** Delete a post by ID */
export const deletePost = (id) => api.delete(`/posts/${id}`).then((r) => r.data);
