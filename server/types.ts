export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: 'user' | 'admin' | 'master';
  email: string;
  created_at: Date;
} 