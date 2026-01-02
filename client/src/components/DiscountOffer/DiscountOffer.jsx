import React from 'react'
import './DiscountOffer.css'
import discountImage from '../../assets/Discountposter.png'

const DiscountOffer = () => {
  return (
    <div>
        <div className="discount-offer-container">
            <div className="discount-offer-image">
                <img src={discountImage} alt="Discount Offer" />
            </div>
           
        </div>  
      
    </div>
  )
}

export default DiscountOffer
