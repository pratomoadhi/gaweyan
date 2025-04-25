'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    setUsers(data || []);
  };

  const addUser = async () => {
    if (!name || !email) return alert('Please fill in both fields');
    await supabase.from('users').insert([{ name, email }]);
    setName('');
    setEmail('');
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">User List</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Name"
          className="border rounded p-2 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="border rounded p-2 flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={addUser}
          className="bg-blue-600 text-white rounded px-4"
        >
          Add
        </button>
      </div>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="mb-2 border-b pb-2">
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </main>
  );
}
