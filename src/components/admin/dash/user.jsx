import React from 'react';

const members = [
  { name: 'John Michael', email: 'john@creative-tim.com', role: 'Manager', status: 'ONLINE', employed: '23/04/18' },
  { name: 'Alexa Liras', email: 'alexa@creative-tim.com', role: 'Programmer', status: 'OFFLINE', employed: '11/01/19' },
  { name: 'Laurent Perrier', email: 'laurent@creative-tim.com', role: 'Executive', status: 'ONLINE', employed: '19/09/17' },
  { name: 'Michael Levi', email: 'michael@creative-tim.com', role: 'Programmer', status: 'ONLINE', employed: '24/12/08' },
  { name: 'Richard Gran', email: 'richard@creative-tim.com', role: 'Manager', status: 'OFFLINE', employed: '04/10/21' },
  { name: 'Miriam Eric', email: 'miriam@creative-tim.com', role: 'Programmer', status: 'OFFLINE', employed: '14/09/20' }

];

export default function UsersPage() {
  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-semibold">Members</h1>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3">Author</th>
              <th className="px-6 py-3">Function</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Employed</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="flex items-center px-6 py-4">
                  <img
                    src={`https://www.gravatar.com/avatar/${member.email}`}
                    alt="Avatar"
                    className="w-10 h-10 mr-3 rounded-full"
                  />
                  {member.name}
                </td>
                <td className="px-6 py-4">{member.role}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-white ${
                      member.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4">{member.employed}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-500 hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}