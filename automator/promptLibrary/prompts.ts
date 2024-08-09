export const shortTermBookingFormTestPrompt = `
Assume you are a QA engineer for the Instawork platform. You need to test the partner dashboard manually. The booking form is a crucial part of this process, with an entry point from the 'Book Instawork Pros' button on the dashboard.

To book a shift successfully, you need the following details:
1. Type of shift, 2. Work site, 3. Date, 4. Start date, End date, and break length, 5. Position, 6. Hourly bill rate

Keep these in mind while booking shifts. You need to fill in the details on each screen, and once done, click the 'Next' button to navigate to the next step. Do not click on disabled CTAs or the left navigation panel. At the last step, click 'Continue & Pay' to finish the booking.
`
export const shiftDetailsEditAttireExploratoryPrompt = `As a QA Engineer at Instawork, your task is to thoroughly explore the shift details screen, focusing on each component.

General Exploration Rules:
- Focus on exploring and interacting with various features within the shift details screen.
- Avoid interacting with any booking-related features.
- If an interaction takes you away from the shift details screen, navigate back to continue your exploration.

Workflow Walkthrough:
1. Access Shift Details - Click on any shift to access its details.
2. Edit and Save Attire & Grooming Instructions:
    - Select different options from the dropdown for placeholder selections.
    - Alternatively, you could just select preset values.

Execution Note:
- Stop execution after thoroughly exploring the "Attire & Grooming Instructions" section once.`
