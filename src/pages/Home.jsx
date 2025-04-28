import { Container } from "react-bootstrap";
import Super from "../components/Super";
import Destination from "../components/Destination";
import Trip from "../components/Trip";
import Footer from "../components/Footer";
import Weather from "../components/Weather";
import PlanesPage from '../components/PlanesPage.jsx';

export default function Home() {
    return (
        <Container fluid>
            <Super
                className="super"
                videoSrc="/videos/star-journey.mp4"
                title="Your Star Journey"
                text="Tailored VIP tour for Unforgettable Holiday"
                buttonText="Explore"
                url="/"
                btnClass="show"
            />
            <div className="weather-section py-4">
                <Weather />
            </div>
            <Destination />
            <Trip />
            <PlanesPage />
            <Footer />
        </Container>
    );
}
