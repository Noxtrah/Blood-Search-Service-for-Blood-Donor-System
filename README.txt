APP SERVICE URLS:
-URL of App Service(Create/Query Donor Page): https://staffserviceblooddonorsystem.azurewebsites.net/createQueryDonor

-URL of App Service(Add Blood to Bank Page): https://staffserviceblooddonorsystem.azurewebsites.net

-URL of App Service: https://clientserviceblooddonorsystem.azurewebsites.net


GITHUB LINKS:
-Client-Service-for-Blood-Donor-System: https://github.com/Noxtrah/Client-Service-for-Blood-Donor-System.git

-Staff-Service-for-Blood-Donor-System: https://github.com/Noxtrah/Staff-Service-for-Blood-Donor-System.git

-Blood-Search-Service-for-Blood-Donor-System: https://github.com/Noxtrah/Blood-Search-Service-for-Blood-Donor-System.git


VIDEO LINK:
-https://drive.google.com/file/d/1hjfoLKzS7pj1UPbMX9lL_xWeDfdwur37/view?usp=sharing


ER-DIAGRAM LINK:
-https://drive.google.com/file/d/111lEQONuACkInMsw0QcEwk_P5JeirKZF/view?usp=sharing 


ASSUMPTIONS:

1-) I assumed blood taken by donors will carried to the nearest blood bank which is in the same city with the donor.


SERVICES:

1-) Client-Service: This service contains both APIs related with this service and frontend of "Blood Request Page". Due of the nature of node.js, I kept backend and frontend in the same service. However, I used API gateway to use /api/search-blood enpoint from 'Blood-Search-Service'. I also used an API from https://documenter.getpostman.com in order to get every city and town of Turkey. Only the towns of selected city will be displayed in dropdown box. When blood request send, it is saved in database. I used mssql and deployed it on Azure.

URL of App Service: https://clientserviceblooddonorsystem.azurewebsites.net

2-) Staff-Service: This service contains both APIs related with this service and frontend of "Add Blood to Bank" and "Create/Query Donor" pages. Due of the nature of node.js, I kept backend and frontend in the same service. I used an API from https://documenter.getpostman.com in order to get every city and town of Turkey. Only the towns of selected city will be displayed in dropdown box. In this service authentication through branch name and password is required. Otherwise donors can't be created. Photo of the donors can be uploaded via url of photo. These photos will be stored in Azure Blob Storage through CDN. I use Azure Front Door as CDN, which offers a broader set of features.

Example branch name: Branch1
Example branch password: password1

URL of CDN: https://donorPhotosCDN.azureedge.net
URL of Blob Storage connected to the CDN: https://donorphotostorage.blob.core.windows.net
(Note: Entering these urls directy to the browser, won't open the files that are stored. The container name and name of file also needs to be added to the url as query parameter.)

Example URL for getting an image of a donor: https://donorphotostorage.blob.core.windows.net/donor-photos/190a8852-106a-41d5-8ed4-87ab88506882.jpg
(Note: Entering this url to the browser will start to download an image(stickman) of a donor)

When "Query Donor" button is clicked, a prompt will appear at the top of the page. In first prompt it will ask for the fullname of donor to be querried. Similarly in the second prompt it will ask for donor's bloodType. If both prompts are left empty, no query operation will be made.
If fullname prompt entered and blood type left empty, it will return the list of all donors with given fullname. Similarly if blood type prompt entered and fullname left empty, it will return list of all donors with the given bloodType. Both command prompts can be entered to make the query more precise. The list on the below of the buttons has also pagination. Each page can only display 3 record. In order to see the other records, users must click on "Next Page" button.

URL of App Service(Create/Query Donor Page): https://staffserviceblooddonorsystem.azurewebsites.net/createQueryDonor

In "Add Blood to Bank" page there are again branch name and password fields are available and they should be entered by user. Blood type and donation date are not entered by user. When donor name field is filled and clicked to the "Search" button, those areas will be automatically filled by the system by gathered information from database. Alo units field should be filled by user before clicking "Add Blood to Bank" button.

URL of App Service(Add Blood to Bank Page): https://staffserviceblooddonorsystem.azurewebsites.net

3-) Blood-Search-Service: This service only contains API without frontend. This API is used by Client-Service via API Gateway. When the user makes a new blood request in the "Blood Request Page", Client-Service calls for this API.

This service also contains:
-> Mail service: Sends an e-mail to the requestor(contact Email) if a blood request on the queue is matched with a blood in the bank within 50 km.

-> Geolocation service: Has some methods to calculate distance between city of blood request and city of blood bank(in my case it is city of donor as it is written in assumptions part).

-> Queue service: Used Azure Service Bus for queue system. If the requested blood doesn't match with any blood in the bank in the time of request, request will send to a queue.

-> Schedule service: Used Azure Function App as scheduler. It will execute my checkBloodRequestsProximity method at 01.00 am every day. This function checks if there are matching reques and blood within 50km. If it finds, mail service send an e-mail to the requestor.


DATABASE:

-Microsoft SQL Server is used for database management.
-Database called BloodDonorDatabase and it contains of 3 tables.
	1-) Donor (DonorId(PK), Fullname, BloodType, Town, City, PhoneNumber, PhotoUrl)
	2-) BloodBank (BloodId(PK), Fullname, BloodType, DonationDate, Units)
	3-) BloodRequest (BloodRequestId(PK), Hospital, City, Town, BloodType, Units, 	ContactEmail)
There is a relationship between Donor Table(zero to many) and Blood Bank Table(zero to many). A blood bank may contain zero or multiple donor and the city column of donors will also represent the city of the blood bank(as written in assumptions). Similarly each donor with the same city and same fullname can have zero or many records in blood bank(Same person can give same blood to the same blood bank multiple times).
