// Address options for events
export const addressOptions = {
  Chennai: [
    "Marina Beach Grounds, Chennai, Tamil Nadu",
    "The Comedy Club, Nungambakkam, Chennai, Tamil Nadu",
    "City Expo Grounds, Nungambakkam, Chennai, Tamil Nadu",
    "Intimate Theatre, Mount Road, Chennai, Tamil Nadu",
    "Chennai Convention Center, Chennai, Tamil Nadu",
    "Chennai Cultural Center, Chennai, Tamil Nadu",
    "Savera Hotel, Dr. Radhakrishnan Salai, Chennai, Tamil Nadu",
  ],
  Bangalore: [
    "Giggle Hub, MG Road, Bangalore, Karnataka",
    "Bangalore International Exhibition Centre, Bangalore, Karnataka",
    "Grand Theatre Hall, MG Road, Bangalore, Karnataka",
    "Bangalore Palace Grounds, Bangalore, Karnataka",
    "Sofitel Hotels, Koramangala, Bangalore, Karnataka",
    "The Leela Palace, Bangalore, Karnataka",
  ],
  Hyderabad: [
    "Comedy Central, Banjara Hills, Hyderabad, Telangana",
    "Hussain Sagar Lakefront, Hyderabad, Telangana",
    "Gachibowli Athletic Stadium, Hyderabad, Telangana",
    "Hyderabad International Convention Centre, Hyderabad, Telangana",
    "Taj Falaknuma Palace, Hyderabad, Telangana",
  ],
  Pune: [
    "The Laugh Lounge, Koregaon Park, Pune, Maharashtra",
    "Pune Indoor Sports Complex, Pune, Maharashtra",
    "Hilton Hotel, Pune, Maharashtra",
    "Pune Convention Centre, Pune, Maharashtra",
  ],
  Coimbatore: [
    "Laugh Arena, RS Puram, Coimbatore, Tamil Nadu",
    "Grand Arena, Avinashi Road, Coimbatore, Tamil Nadu",
    "Coimbatore Art Gallery, Coimbatore, Tamil Nadu",
    "Coimbatore Convention Hall, Coimbatore, Tamil Nadu",
  ],
  Trichy: [
    "Trichy Central Park, Trichy, Tamil Nadu",
    "Sri Ranganatha Convention Centre, Trichy, Tamil Nadu",
  ],
};

export const getAddressesByLocation = (location) => {
  return addressOptions[location] || [];
};
