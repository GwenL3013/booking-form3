import "./SuperStyles.css";

export default function Super(props) {
    return (
        <div className={props.className}>
            {props.videoSrc ? (
                <video
                    className="super-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src={props.videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            ) : (
                <img alt="super background" src={props.superImg} />
            )}
            <div className="super-text">
                <h1>{props.title}</h1>
                <p>{props.text}</p>
                <a href={props.url} className={props.btnClass}>
                    {props.buttonText}
                </a>
            </div>
        </div>
    );
}
