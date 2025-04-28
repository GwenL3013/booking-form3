import "./DestinationStyles.css";
import DestinationData from "./DestinationData";


export default function Destination() {

    return (
        <div className="destination">
            <h1>Popular Destinations</h1>
            <p> MyHolidays presents an extraordinary travel experience with our
                Signature Tour Packages, thoughtfully curated to highlight the globe’s
                most coveted destinations. These carefully crafted tours feature a selection
                of world-renowned countries, chosen for their unparalleled appeal and
                popularity among our esteemed travelers. Committed to offering unforgettable journeys,
                our Signature Tour Packages encompass a wide array of destinations.
                Each package is a reflection of our dedication to delivering exceptional
                adventures and rich cultural experiences, ensuring lifelong memories for every traveler.</p>
            <DestinationData
                className="first-des"
                heading="South Island, New Zealand"
                text="The South Island of New Zealand is a breathtaking destination known for its
                        stunning landscapes, adventure-filled activities, and serene natural beauty.
                        From snow-capped mountains and vast fjords to charming coastal towns and pristine lakes,
                        the South Island offers a diverse array of experiences that captivate travelers from all
                        over the world. Whether you're looking to immerse yourself in the vibrant culture of
                        Queenstown, explore the dramatic landscapes of Fiordland National Park, or relax by
                        the crystal-clear waters of Lake Tekapo, the South Island promises a journey of
                        discovery and adventure. Its rugged terrain, rich wildlife, and outdoor activities
                        make it the perfect destination for nature lovers, thrill-seekers, and those seeking tranquility alike."
                img1={"https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                img2={"https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fGxhbmRzY2FwZXxlbnwwfHwwfHx8MA%3D%3D"}
            />

            <DestinationData
                className="first-des-reverse"
                heading="Perth, Australia"
                text="Perth, Australia, is a vibrant and sun-kissed city that offers a perfect blend of natural beauty, 
                modern urban life, and rich cultural experiences. Located on the stunning western coast of Australia, 
                Perth is known for its pristine beaches, breathtaking sunsets, and laid-back lifestyle. Whether you're 
                lounging on the golden sands of Cottesloe Beach, exploring the lush Kings Park and Botanic Garden, 
                or strolling through the lively streets of Northbridge with its bustling cafes and nightlife, 
                Perth has something for every traveler.

                The city is also a gateway to nearby natural wonders, such as the famous Swan Valley wine region, 
                Rottnest Island with its adorable quokkas, and the expansive Outback. 
                From world-class shopping and dining to outdoor adventures like surfing, hiking, 
                and wildlife spotting, Perth delivers an unforgettable Australian experience that seamlessly combines 
                relaxation, excitement, and exploration."
                img1={"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTM5fHxsYW5kc2NhcGV8ZW58MHx8MHx8fDA%3D"}
                img2={"https://images.unsplash.com/photo-1490879112094-281fea0883dc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjAzfHxsYW5kc2NhcGV8ZW58MHx8MHx8fDA%3D"}
            />
        </div>
    )
}