import mongoose from '../config/db'

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  collection: 'Settings',
  timestamps: true,
})

const Settings = mongoose.model('Settings', settingsSchema)

export default Settings
