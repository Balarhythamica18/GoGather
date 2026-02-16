import ComedyShow from '../components/Comedy/ComedyShow'
import DiscountOffer from '../components/DiscountOffer/DiscountOffer'
import Head from '../components/Head/Head'
import MakeOwnEvent from '../components/MakeOwnEvent/MakeOwnEvent'
import Navbar from '../components/Navbar/Navbar'
import TopEvent from '../components/TopEvent/TopEvent'
import Search from '../components/Search/Search'  

import UpcomingEvents from '../components/UpcomingEvents/UpcomingEvents'



const Home = () => {
  return (
    <div>
      <Navbar />
       <Head />
    
      <UpcomingEvents />
        <DiscountOffer />
        <TopEvent />
        <ComedyShow />
        <MakeOwnEvent />
    </div>
  )
}

export default Home
