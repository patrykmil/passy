import { ThemeProvider } from '@/components/theme-provider';
import '@/index.css';
import AddCredential from '@/routes/AddCredential.tsx';
import App from '@/routes/App.tsx';
import ApplyToTeam from '@/routes/ApplyToTeam.tsx';
import ChangeSecurityInfo from '@/routes/ChangeSecurityInfo';
import CreateTeam from '@/routes/CreateTeam.tsx';
import Credentials from '@/routes/Credentials.tsx';
import Login from '@/routes/Login.tsx';
import Register from '@/routes/Register.tsx';
import Teams from '@/routes/Teams.tsx';
import UpdateCredential from '@/routes/UpdateCredential.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/credentials', element: <Credentials /> },
  { path: '/teams', element: <Teams /> },
  { path: '/credentials/add', element: <AddCredential /> },
  { path: '/credentials/update/:id', element: <UpdateCredential /> },
  { path: '/credentials/update-group/:group', element: <UpdateCredential /> },
  { path: '/apply', element: <ApplyToTeam /> },
  { path: '/apply/:teamCode', element: <ApplyToTeam /> },
  { path: '/teams/create', element: <CreateTeam /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/update-security', element: <ChangeSecurityInfo /> },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
        {/* <ReactQueryDevtools /> */}
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
