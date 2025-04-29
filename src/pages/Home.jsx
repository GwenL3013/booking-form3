import { Container } from "react-bootstrap";
import Super from "../components/Super";
import Destination from "../components/Destination";
import Trip from "../components/Trip";
import Footer from "../components/Footer";
import Weather from "../components/Weather";
import PlanesPage from '../components/PlanesPage.jsx';
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

function AnimatedSection({ children, direction = "up", delay = 0 }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    const variants = {
        hidden: {
            opacity: 0,
            x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
            y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration: 1.5, delay: delay },
        },
    };

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
        >
            {children}
        </motion.div>
    );
}

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



            <AnimatedSection direction="up" delay={1}>
                <Destination />
            </AnimatedSection>

            <AnimatedSection direction="right" delay={1}>
                <Trip />
            </AnimatedSection>

            <AnimatedSection direction="down" delay={1}>
                <PlanesPage />
            </AnimatedSection>

            <Footer />
        </Container>
    );
}