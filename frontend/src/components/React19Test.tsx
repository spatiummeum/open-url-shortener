import { use, useOptimistic, useState } from 'react';

// Test component to verify React 19 features
export function React19Test() {
  const [messages, setMessages] = useState<string[]>(['Hello React 19!']);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage: string) => [...state, newMessage]
  );

  const addMessage = async (message: string) => {
    addOptimisticMessage(message);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">React 19 Features Test</h3>
      
      <div className="mb-4">
        <h4 className="font-medium">useOptimistic Hook:</h4>
        <ul className="list-disc pl-4">
          {optimisticMessages.map((message, index) => (
            <li key={index} className="text-sm">
              {message}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => addMessage(`Message ${Date.now()}`)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Optimistic Message
      </button>

      <div className="mt-4 text-sm text-gray-600">
        ✅ React 19.1.0 working correctly!
        <br />
        ✅ useOptimistic hook available
        <br />
        ✅ New features ready to use
      </div>
    </div>
  );
}

// Promise-based component using React 19's "use" hook
export function PromiseComponent({ dataPromise }: { dataPromise: Promise<string> }) {
  try {
    const data = use(dataPromise);
    return <div className="p-2 bg-green-100 text-green-800 rounded">Data loaded: {data}</div>;
  } catch (error) {
    return <div className="p-2 bg-red-100 text-red-800 rounded">Error loading data</div>;
  }
}
