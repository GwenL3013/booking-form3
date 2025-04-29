import "./DestinationStyles.css";
import DestinationData from "./DestinationData";


export default function Destination() {

    return (
        <div className="destination">
            <h1>Popular Destinations</h1>

            <DestinationData
                className="first-des"
                heading="South Island, New Zealand"
                text="South Island, New Zealand is a land for Adventure and Natural Beauty. New Zealand's South Island 
                is famed for its dramatic landscapes, from snowy peaks and deep fjords to crystal-clear lakes and 
                charming towns. Whether you're exploring Queenstown, hiking Fiordland, or relaxing by Lake Tekapo, 
                the island offers unforgettable adventures and serene escapes for every traveler."
                img1={"https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                img2={"https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fGxhbmRzY2FwZXxlbnwwfHwwfHx8MA%3D%3D"}
            />

            <DestinationData
                className="first-des-reverse"
                heading="Perth, Australia"
                text="Sunshine, Beaches & Culture

                    Perth, on Australia’s west coast, blends natural beauty with a relaxed urban vibe. 
                    From golden beaches and vibrant nightlife in Northbridge to the greenery of Kings Park, 
                    it offers something for everyone. 
                    Explore nearby gems like Swan Valley, Rottnest Island, and the Outback for a mix of adventure and charm."
                img1={"https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTM5fHxsYW5kc2NhcGV8ZW58MHx8MHx8fDA%3D"}
                img2={"https://images.unsplash.com/photo-1490879112094-281fea0883dc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjAzfHxsYW5kc2NhcGV8ZW58MHx8MHx8fDA%3D"}
            />
        </div>
    )
}