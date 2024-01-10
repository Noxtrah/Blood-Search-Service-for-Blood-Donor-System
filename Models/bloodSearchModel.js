// bloodSearchModel.js
class BloodSearchRequest {
    constructor(city, town, bloodType, units, contactEmail) {
      this.city = city;
      this.town = town;
      this.bloodType = bloodType;
      this.units = units;
      this.contactEmail = contactEmail;
    }
  }

export {BloodSearchRequest}
