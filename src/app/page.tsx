'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

const PAGE_SIZE = 5;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formUser, setFormUser] = useState({ name: '', email: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email'); // only select needed fields

    if (error) {
      toast.error('Error fetching users: ' + error.message);
      return;
    }

    if (data) {
      setUsers(data as User[]);
    }
  };

  // // Protect route
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const { data } = await supabase.auth.getSession();
  //     if (!data.session) {
  //       router.push('/auth');
  //     } else {
  //       setLoading(false);
  //     }
  //   };
  //   checkAuth();
  // }, [router]);

  // if (loading) {
  //   return <div className="p-6 text-center text-gray-500">Checking session...</div>;
  // }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  const pageCount = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const goToPrevPage = () => setPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPage((p) => Math.min(p + 1, pageCount));

  const handleSaveUser = async () => {
    const { name, email } = formUser;

    if (!name || !email) {
      toast.error('Please fill in both fields');
      return;
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      toast.error("Invalid email");
      return;
    }

    if (editingUser) {
      const { error } = await supabase
        .from('users')
        .update({ name, email })
        .eq('id', editingUser.id);

      if (error) {
        toast.error('Error updating user: ' + error.message);
        return;
      } else {
        toast.success('User updated successfully');
      }
    } else {
      const { error } = await supabase
        .from('users')
        .insert([{ name, email }]);

      if (error) {
        toast.error('Error adding user: ' + error.message);
        return;
      } else {
        toast.success('User added successfully');
      }
    }

    setFormUser({ name: '', email: '' });
    setEditingUser(null);
    setShowModal(false);
    fetchUsers();
  };

  const handleDeleteUser = async (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this user?');
    if (!confirm) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return alert('Error deleting user: ' + error.message);
    fetchUsers();
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">User Directory</h1>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/auth');
        }}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>

      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="border border-gray-300 rounded px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2"
        >
          Add User
        </button>
      </div>

      {/* User Table */}
      <table className="min-w-full border border-gray-300 rounded overflow-hidden">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="text-left py-3 px-6">Name</th>
            <th className="text-left py-3 px-6">Email</th>
            <th className="text-left py-3 px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center py-6 text-gray-500">
                No users found.
              </td>
            </tr>
          ) : (
            paginatedUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 hover:bg-gray-100"
              >
                <td className="py-4 px-6">{user.name}</td>
                <td className="py-4 px-6">{user.email}</td>
                <td className="py-4 px-6 flex gap-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => {
                      setEditingUser(user);
                      setFormUser({ name: user.name, email: user.email });
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={goToPrevPage}
          disabled={page === 1}
          className={`px-4 py-2 rounded ${page === 1
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Previous
        </button>

        <span>
          Page {page} of {pageCount}
        </span>

        <button
          onClick={goToNextPage}
          disabled={page === pageCount || pageCount === 0}
          className={`px-4 py-2 rounded ${page === pageCount || pageCount === 0
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          Next
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-gray-900 rounded-xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>

            <input
              type="text"
              placeholder="Name"
              className="border border-gray-300 w-full px-4 py-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formUser.name}
              onChange={(e) =>
                setFormUser((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="border border-gray-300 w-full px-4 py-2 mb-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formUser.email}
              onChange={(e) =>
                setFormUser((prev) => ({ ...prev, email: e.target.value }))
              }
            />

            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowModal(false);
                  setEditingUser(null);
                  setFormUser({ name: '', email: '' });
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingUser ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}


    </main>
  );
}
