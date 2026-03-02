import Dashboard from './page/Dashboard';
import { Routes, Route, } from "react-router-dom";
import Users from './page/Users';
import Students from './page/Students';
import Teachers from './page/Teachers';
import Class from './page/Class';
import Login from './page/Login';
import Register from './page/Register'
import Layout from './page/Layout';
import ForgetPassword from './page/ForgetPassword';
import Subject from './page/Subject'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ForgetPassword" element={<ForgetPassword />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/students" element={<Students />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/class" element={<Class />} />
          <Route path='/subjects' element={<Subject />}></Route>
        </Route>
      </Routes>
    </div>

  );
}

export default App;
