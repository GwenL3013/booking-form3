import { useParams } from 'react-router-dom';

const TourPage = () => {
    const { id } = useParams();  // Get the tour ID from the URL

    // Fetch and display the tour details based on the ID
    // You can fetch data from an API or state based on the ID

    return (
        <div>
            <h1>Tour Details for Tour ID: {id}</h1>
            {/* Show tour details here */}
        </div>
    );
};

export default TourPage;
