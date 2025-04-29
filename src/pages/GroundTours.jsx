import { Container } from "react-bootstrap";
import Super from "../components/Super";
import GroupToursImg from "../assets/3.jpg"
import Footer from "../components/Footer";
import FlightBookingBanner from "../components/FlightBookingBanner";

export default function GroundTours() {
    return (
        <>
            <Container fluid>
                <Super
                    className="super-mid"
                    superImg={GroupToursImg}
                    title="Services"
                    btnClass="hide"
                />
                <Container className="mt-4">
                    <FlightBookingBanner />
                </Container>
                <Footer />
            </Container>
        </>
    )
}