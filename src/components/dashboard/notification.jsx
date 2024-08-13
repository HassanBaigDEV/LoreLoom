// components/Notifications.js
import React from "react";

export default function Notifications() {
  return (
    <div className="col-span-2 overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Due to the impact of Hurricane Beryl on Jamaica, where our support team is located, there may be interruptions or delays in real-time support chats and email responses. We apologize for any inconvenience this may cause. You can still send your queries and...
        </p>
        <a href="#" className="text-blue-600 hover:text-blue-800">View All</a>
      </div>
    </div>
  );
}
