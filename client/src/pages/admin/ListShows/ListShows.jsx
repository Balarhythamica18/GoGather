import React from 'react'
import Title from '../../../components/Admin/Title'
import './ListShows.css'

// import data
import { comedyEvents, topevents } from '../../../data/assets'

// merge & pick 5 events
const events = [...comedyEvents, ...topevents].slice(0, 5)

const ListShows = () => {
  return (
    <div className="listshows">
      <Title text1="Admin" text2="List Shows" />

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Total Bookings</th>
                <th>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => {
                const bookings = Math.floor(Math.random() * 50) + 1
                const revenue =
                  bookings * parseInt(event.price?.replace('₹', '') || 500)

                return (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{event.month} {event.date}</td>
                    <td>{event.location}</td>
                    <td>{bookings}</td>
                    <td>₹{revenue}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ListShows
