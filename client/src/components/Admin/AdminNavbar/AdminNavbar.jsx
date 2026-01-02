import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../../assets/logo.png'
import './AdminNavbar.css'

const AdminNavbar = () => {
  return (
    <div className="admin-navbar">
      <Link to="/">
        <img src={logo} className="adminlogo" alt="GoGather Logo" />
      </Link>
    </div>
  )
}

export default AdminNavbar
