import ComedyShow from '../components/Comedy/ComedyShow'
import DiscountOffer from '../components/DiscountOffer/DiscountOffer'
import Head from '../components/Head/Head'
import MakeOwnEvent from '../components/MakeOwnEvent/MakeOwnEvent'

import TopEvent from '../components/TopEvent/TopEvent'


import UpcomingEvents from '../components/UpcomingEvents/UpcomingEvents'




const Home = () => {
  return (
    <div>

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
