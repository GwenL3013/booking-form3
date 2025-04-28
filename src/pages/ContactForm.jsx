import "bootstrap/dist/css/bootstrap.min.css";
import "./ContactFormStyles.css";
import { Form } from "react-bootstrap";
import React from "react";

export function ContactForm() {
    return (
        <div className="container-lg py-5">
            <div className="row justify-content-center ">
                <div className="col-12 col-md-11 col-lg-10 col-xl-10 col-xxl-8">  {/* <--- Adjusted width */}
                    <div className="custom-card card shadow p-4 w-100" style={{ minHeight: '500px' }} >
                        <h1 className="text-center mb-4">Send us a message!</h1>
                        <Form>
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Name"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Subject"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <textarea
                                    className="form-control"
                                    placeholder="Message"
                                    rows="4"
                                    required
                                ></textarea>
                            </div>
                            <div className="d-flex justify-content-center">
                                <button type="submit" className="btn btn-primary px-4">
                                    Send Message
                                </button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
