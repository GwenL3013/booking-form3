import "./TripStyles.css";
import { TripData } from "./TripData";

export default function Trip() {
    return (
        <div className="trip">
            <h1>Recent Trips</h1>
            <p>Discover Unique Destination</p>
            <div className="tripcard">
                <TripData
                    image={"https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjA0fHxsYW5kc2NhcGV8ZW58MHx8MHx8fDA%3D"}
                    heading="Trip in New Zealand"
                    text="A trip to New Zealand promises an unforgettable adventure, filled with diverse landscapes, rich Maori culture, and thrilling outdoor activities. "
                />
                <TripData
                    image={"https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8amFwYW58ZW58MHx8MHx8fDA%3D"}
                    heading="Trip in Japan"
                    text="A trip to Japan is a truly captivating experience, blending traditional culture, modern technology, and natural beauty. Whether you're looking for historic temples, scenic landscapes, or vibrant city life, Japan offers a wide range of adventures."
                />
                <TripData
                    image={"https://images.unsplash.com/photo-1577609060534-4254158ea447?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzl8fG1hbGF5c2lhfGVufDB8fDB8fHww"}
                    heading="Trip in Malaysia"
                    text="A trip to Malaysia offers a captivating mix of rich culture, modern cities, beautiful beaches, and tropical rainforests. From bustling cities to tranquil islands and mountains, Malaysia is diverse in its offerings."
                />
            </div>
        </div>
    )
}