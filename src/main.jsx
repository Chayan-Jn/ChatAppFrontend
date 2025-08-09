import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {createBrowserRouter,Navigate,RouterProvider} from 'react-router-dom';
import Register from './Register.jsx'
import Login from './Login.jsx';
import HomePage from './HomePage.jsx';

const router = createBrowserRouter([
  {path:"/",element:<Navigate to={"/chat-app/register"}/>},
  {path:"/chat-app/register",element:<Register/>},
  {path:"/chat-app/login",element:<Login/>},
  {path:"/chat-app/home",element:<HomePage/>}
]
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
