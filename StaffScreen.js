import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

const BASE = 'https://quick10backend.onrender.com'

export default function StaffScreen() {
  const [staffList, setStaffList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('delivery_partner')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState('')
  const [panPhotoUrl, setPanPhotoUrl] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const loadStaff = async () => {
    try {
      setLoading(true)
      const res = await fetch(BASE + '/api/staff')
      const data = await res.json()
      setStaffList(data.staff || [])
    } catch (err) {
      Alert.alert('Error', 'Staff load nahi hua: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const uploadImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        base64: true,
      })

      if (result.canceled) return

      const base64 = 'data:image/jpeg;base64,' + result.assets[0].base64

      const uploadRes = await fetch(BASE + '/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      const uploadData = await uploadRes.json()

      if (uploadData.success) {
        if (type === 'photo') setPhotoUrl(uploadData.url)
        if (type === 'aadhaar') setAadhaarPhotoUrl(uploadData.url)
        if (type === 'pan') setPanPhotoUrl(uploadData.url)
        Alert.alert('✅', 'Photo upload ho gayi!')
      } else {
        Alert.alert('Error', 'Upload failed: ' + (uploadData.message || 'Unknown error'))
      }
    } catch (err) {
      Alert.alert('Error', 'Upload failed: ' + err.message)
    }
  }

  const saveStaff = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Naam daalo!')
      return
    }
    if (!phone.trim() || phone.trim().length !== 10) {
      Alert.alert('Error', '10 digit phone number daalo!')
      return
    }
    if (!password.trim() && !editingStaff) {
      Alert.alert('Error', 'Password daalo!')
      return
    }
    if (!role) {
      Alert.alert('Error', 'Role select karo!')
      return
    }

    try {
      setLoading(true)

      const staffData = {
        name: name.trim(),
        phone: phone.trim(),
        role,
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim(),
        bankAccount: bankAccount.trim(),
        bankIfsc: bankIfsc.trim(),
        photoUrl,
        aadhaarPhotoUrl,
        panPhotoUrl,
      }

      if (password.trim()) {
        staffData.password = password.trim()
      }

      const url = editingStaff
        ? BASE + '/api/staff/' + editingStaff._id
        : BASE + '/api/staff'

      const method = editingStaff ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      })

      const data = await res.json()

      if (data.success) {
        Alert.alert(
          '✅ Success!',
          editingStaff ? 'Staff update ho gaya!' : 'Naya staff add ho gaya!'
        )
        loadStaff()
        setShowForm(false)
        resetForm()
      } else {
        Alert.alert('❌ Error', data.message || 'Save failed!')
      }
    } catch (err) {
      Alert.alert('❌ Error', 'Network error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setPhone('')
    setPassword('')
    setRole('delivery_partner')
    setAadhaarNumber('')
    setPanNumber('')
    setBankAccount('')
    setBankIfsc('')
    setPhotoUrl('')
    setAadhaarPhotoUrl('')
    setPanPhotoUrl('')
    setEditingStaff(null)
  }

  const deleteStaff = (id) => {
    Alert.alert('Delete?', 'Sure ho?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(BASE + '/api/staff/' + id, { method: 'DELETE' })
            loadStaff()
          } catch (err) {
            Alert.alert('Error', 'Delete failed: ' + err.message)
          }
        },
      },
    ])
  }

  const openEditForm = (staff) => {
    setEditingStaff(staff)
    setName(staff.name || '')
    setPhone(staff.phone || '')
    setPassword('')
    setRole(staff.role || 'delivery_partner')
    setAadhaarNumber(staff.aadhaarNumber || '')
    setPanNumber(staff.panNumber || '')
    setBankAccount(staff.bankAccount || '')
    setBankIfsc(staff.bankIfsc || '')
    setPhotoUrl(staff.photoUrl || '')
    setAadhaarPhotoUrl(staff.aadhaarPhotoUrl || '')
    setPanPhotoUrl(staff.panPhotoUrl || '')
    setShowForm(true)
  }

  const filtered =
    activeTab === 'all'
      ? staffList
      : staffList.filter((s) =>
          activeTab === 'delivery'
            ? s.role === 'delivery_partner'
            : s.role === 'picker'
        )

  const renderStaffCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.name ? item.name[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.staffName}>{item.name}</Text>
          <View
            style={[
              styles.badge,
              item.isActive === false ? styles.badgeInactive : styles.badgeActive,
            ]}
          >
            <Text style={styles.badgeText}>
              {item.isActive === false ? 'Inactive' : 'Active'}
            </Text>
          </View>
        </View>

        <Text style={styles.staffRole}>
          {item.role === 'delivery_partner' ? 'Delivery Partner' : 'Picker'}
        </Text>

        <Text style={styles.staffPhone}>📞 {item.phone}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEditForm(item)}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteStaff(item._id)}
        >
          <Text style={styles.deleteBtnText}>Del</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Management</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetForm()
            setShowForm(true)
          }}
        >
          <Text style={styles.addBtnText}>+ Add Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'delivery', label: 'Delivery Partners' },
          { key: 'picker', label: 'Pickers' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Staff List */}
      {loading && !showForm ? (
        <ActivityIndicator size="large" color="#F5C842" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderStaffCard}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Koi staff nahi mila</Text>
          }
        />
      )}

      {/* Add/Edit Form Modal */}
      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingStaff ? 'Staff Edit Karo' : 'Naya Staff Add Karo'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowForm(false)
                resetForm()
              }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            {/* Profile Photo */}
            <Text style={styles.sectionLabel}>Profile Photo</Text>
            <View style={styles.photoRow}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.previewPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>No Photo</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadImage('photo')}
              >
                <Text style={styles.uploadBtnText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Basic Info */}
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Staff ka naam"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="10 digit phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={10}
            />

            <Text style={styles.label}>
              Password {editingStaff ? '(khali chhodo to same rahega)' : '*'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Role Selector */}
            <Text style={styles.label}>Role *</Text>
            <View style={styles.roleRow}>
              {[
                { value: 'delivery_partner', label: 'Delivery Partner' },
                { value: 'picker', label: 'Picker' },
              ].map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleBtn,
                    role === r.value && styles.roleBtnActive,
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleBtnText,
                      role === r.value && styles.roleBtnTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Documents */}
            <Text style={styles.sectionLabel}>Documents</Text>

            <Text style={styles.label}>Aadhaar Number</Text>
            <TextInput
              style={styles.input}
              placeholder="12 digit Aadhaar"
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              keyboardType="numeric"
              maxLength={12}
            />

            <Text style={styles.label}>Aadhaar Photo</Text>
            <View style={styles.photoRow}>
              {aadhaarPhotoUrl ? (
                <Image source={{ uri: aadhaarPhotoUrl }} style={styles.previewPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>No Photo</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadImage('aadhaar')}
              >
                <Text style={styles.uploadBtnText}>Upload Aadhaar</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>PAN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="PAN number"
              value={panNumber}
              onChangeText={setPanNumber}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Text style={styles.label}>PAN Photo</Text>
            <View style={styles.photoRow}>
              {panPhotoUrl ? (
                <Image source={{ uri: panPhotoUrl }} style={styles.previewPhoto} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>No Photo</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => uploadImage('pan')}
              >
                <Text style={styles.uploadBtnText}>Upload PAN</Text>
              </TouchableOpacity>
            </View>

            {/* Bank Details */}
            <Text style={styles.sectionLabel}>Bank Details</Text>

            <Text style={styles.label}>Bank Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Account number"
              value={bankAccount}
              onChangeText={setBankAccount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Bank IFSC Code</Text>
            <TextInput
              style={styles.input}
              placeholder="IFSC code"
              value={bankIfsc}
              onChangeText={setBankIfsc}
              autoCapitalize="characters"
              maxLength={11}
            />

            {/* Action Buttons */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveStaff}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingStaff ? 'Update Karo' : 'Save Karo'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    color: '#F5C842',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#F5C842',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#F5C842',
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5C842',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  cardBody: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  staffRole: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  staffPhone: {
    fontSize: 13,
    color: '#444',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#e6f9ee',
  },
  badgeInactive: {
    backgroundColor: '#fde8e8',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  cardActions: {
    gap: 6,
  },
  editBtn: {
    backgroundColor: '#F5C842',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  editBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#999',
    fontSize: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    color: '#F5C842',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#fff',
    fontSize: 20,
    paddingHorizontal: 8,
  },
  form: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F5C842',
    paddingLeft: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleBtnActive: {
    borderColor: '#F5C842',
    backgroundColor: '#fffbe6',
  },
  roleBtnText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  roleBtnTextActive: {
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  previewPhoto: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 10,
    color: '#999',
  },
  uploadBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#F5C842',
    fontWeight: 'bold',
    fontSize: 13,
  },
  formActions: {
    marginTop: 28,
    gap: 12,
  },
  saveBtn: {
    backgroundColor: '#F5C842',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelBtnText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 16,
  },
})
