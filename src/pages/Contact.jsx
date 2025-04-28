import { Container } from "react-bootstrap";
import Super from "../components/Super";
import GroupToursImg from "../assets/2.jpg"
import Footer from "../components/Footer";
import { ContactForm } from "./ContactForm";

export default function Contact() {
    return (
        <>
            <Container fluid>
                <Super
                    className="super-mid"
                    superImg={GroupToursImg}
                    title="Contact Us"

                    btnClass="hide"
                />

                <ContactForm />
                <Footer />
            </Container>
        </>
    )
}