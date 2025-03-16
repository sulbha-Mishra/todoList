import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import AllTasks from './screens/AllTasks';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AllTasks />
    </QueryClientProvider>
  );
};

export default App;
