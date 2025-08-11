const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Trip title is required'],
    trim: true,
    maxlength: [100, 'Trip title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Trip description cannot exceed 500 characters']
  },
  startPlace: {
    type: String,
    required: [true, 'Start place is required'],
    trim: true
  },
  endPlace: {
    type: String,
    required: [true, 'End place is required'],
    trim: true
  },
  stops: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  travelers: {
    type: Number,
    default: 1,
    min: [1, 'At least 1 traveler is required']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  tripType: {
    type: String,
    enum: ['leisure', 'business', 'adventure', 'cultural', 'family', 'romantic'],
    default: 'leisure'
  },
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'completed', 'cancelled'],
    default: 'planned'
  },
  itinerary: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  transportOptions: {
    flights: [{
      type: mongoose.Schema.Types.Mixed
    }],
    trains: [{
      type: mongoose.Schema.Types.Mixed
    }],
    buses: [{
      type: mongoose.Schema.Types.Mixed
    }]
  },
  hotelOptions: [{
    type: mongoose.Schema.Types.Mixed
  }],
  attractions: [{
    type: mongoose.Schema.Types.Mixed
  }],
  totalCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  review: {
    type: String,
    trim: true,
    maxlength: [500, 'Review cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for better query performance
tripSchema.index({ userId: 1, status: 1 });
tripSchema.index({ startDate: 1 });
tripSchema.index({ status: 1, startDate: 1 });

// Virtual for trip duration
tripSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Method to check if trip is in the past
tripSchema.methods.isPast = function() {
  return this.endDate < new Date();
};

// Method to check if trip is ongoing
tripSchema.methods.isOngoing = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

// Method to check if trip is upcoming
tripSchema.methods.isUpcoming = function() {
  return this.startDate > new Date();
};

// Method to get trip summary
tripSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    startPlace: this.startPlace,
    endPlace: this.endPlace,
    startDate: this.startDate,
    endDate: this.endDate,
    duration: this.duration,
    status: this.status,
    totalCost: this.totalCost,
    travelers: this.travelers,
    tripType: this.tripType
  };
};

module.exports = mongoose.model('Trip', tripSchema);
