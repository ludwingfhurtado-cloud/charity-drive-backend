const mongoose = require('mongoose');

const LatLngSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const RideOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  multiplier: { type: Number, required: true }
}, { _id: false });

const CharitySchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
}, { _id: false });

const rideSchema = new mongoose.Schema({
  pickup: { type: LatLngSchema, required: true },
  dropoff: { type: LatLngSchema, required: true },
  pickupAddress: { type: String, required: true },
  dropoffAddress: { type: String, required: true },
  rideOption: { type: RideOptionSchema, required: true },
  suggestedFare: { type: Number, required: true },
  finalFare: { type: Number, required: true },
  distanceInKm: { type: Number },
  travelTimeInMinutes: { type: Number },
  charity: { type: CharitySchema },
  status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'completed', 'cancelled'] }
}, { timestamps: true });

// The frontend uses 'id', so we'll add a virtual to map '_id' to 'id'.
rideSchema.virtual('id').get(function(){
    return this._id.toHexString();
});

rideSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('Ride', rideSchema);
