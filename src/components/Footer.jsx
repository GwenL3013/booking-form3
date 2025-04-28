import "./FooterStyles.css";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Footer() {
    return (
        <div className="footer bg-dark text-light py-5">
            <div className="container">
                {/* Top Branding */}
                <div className="text-center mb-4">
                    <h1>BetaHoliday</h1>
                    <p>We always make holiday better</p>
                    <div className="d-flex justify-content-center gap-3 mt-3">
                        <a href="/" className="text-light">
                            <i className="fa-brands fa-facebook fa-lg"></i>
                        </a>
                        <a href="/" className="text-light">
                            <i className="fa-brands fa-instagram fa-lg"></i>
                        </a>
                        <a href="/" className="text-light">
                            <i className="fa-brands fa-twitter fa-lg"></i>
                        </a>
                        <a href="/" className="text-light">
                            <i className="fa-brands fa-whatsapp fa-lg"></i>
                        </a>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="row text-center text-md-start">
                    <div className="col-md-4 mb-4">
                        <h4>Visit</h4>
                        <ul className="list-unstyled">
                            <li><a href="/" className="text-light text-decoration-none">China</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Australia</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Japan</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Vietnam</a></li>
                            <li><a href="/" className="text-light text-decoration-none">New Zealand</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Thailand</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Philippines</a></li>
                        </ul>
                    </div>

                    <div className="col-md-4 mb-4">
                        <h4>Explore</h4>
                        <ul className="list-unstyled">
                            <li><a href="/" className="text-light text-decoration-none">About Us</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Corporate</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Services</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Blogs</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Career</a></li>
                        </ul>
                    </div>

                    <div className="col-md-4 mb-4">
                        <h4>Contact Us</h4>
                        <ul className="list-unstyled">
                            <li><a href="tel:+601234567" className="text-light text-decoration-none">+601234567</a></li>
                            <li><a href="tel:031234567" className="text-light text-decoration-none">031234567</a></li>
                            <li><a href="mailto:betaholiday@betaholiday.com" className="text-light text-decoration-none">betaholiday@betaholiday.com</a></li>
                            <li><a href="/" className="text-light text-decoration-none">Wisma ABC, Jalan 123, 5000, Kuala Lumpur, Malaysia</a></li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="footer-bottom mt-4">
                    &copy; {new Date().getFullYear()} BetaHoliday. All rights reserved.
                </div>
            </div>
        </div>
    );
}
