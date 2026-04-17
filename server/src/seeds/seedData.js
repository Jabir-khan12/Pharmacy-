import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import Batch from '../models/Batch.js';
import Notification from '../models/Notification.js';
import StockTransaction from '../models/StockTransaction.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await Supplier.deleteMany({});
    await Batch.deleteMany({});
    await Notification.deleteMany({});
    await StockTransaction.deleteMany({});

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        email: 'admin@pharmacy.com',
        password: 'Admin@123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phone: '1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      {
        email: 'pharmacist@pharmacy.com',
        password: 'Pharma@123',
        role: 'pharmacist',
        firstName: 'John',
        lastName: 'Pharmacist',
        phone: '1234567891',
        address: {
          street: '456 Oak Ave',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
          country: 'USA'
        }
      },
      {
        email: 'customer@pharmacy.com',
        password: 'Customer@123',
        role: 'customer',
        firstName: 'Jane',
        lastName: 'Customer',
        phone: '1234567892',
        address: {
          street: '789 Pine Rd',
          city: 'New York',
          state: 'NY',
          zipCode: '10003',
          country: 'USA'
        }
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create medicines
    console.log('Creating medicines...');
    const medicines = await Medicine.create([
      {
        name: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        category: 'Analgesics',
        manufacturer: 'PharmaCorp',
        description: 'Pain relief and fever reducer',
        dosageForm: 'Tablet',
        strength: '500mg',
        price: 5.99,
        stockQuantity: 500,
        reorderLevel: 100,
        expiryDate: new Date('2027-12-31'),
        batchNumber: 'PARA-2024-001',
        sku: 'MED-PARA-500',
        rackLocation: 'A1',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Amoxicillin 250mg',
        genericName: 'Amoxicillin',
        category: 'Antibiotics',
        manufacturer: 'MedLife',
        description: 'Broad-spectrum antibiotic',
        dosageForm: 'Capsule',
        strength: '250mg',
        price: 12.99,
        stockQuantity: 200,
        reorderLevel: 50,
        expiryDate: new Date('2027-06-30'),
        batchNumber: 'AMOX-2024-002',
        sku: 'MED-AMOX-250',
        rackLocation: 'B2',
        isPrescriptionRequired: true,
        status: 'active'
      },
      {
        name: 'Ibuprofen 400mg',
        genericName: 'Ibuprofen',
        category: 'Analgesics',
        manufacturer: 'HealthPlus',
        description: 'Anti-inflammatory pain relief',
        dosageForm: 'Tablet',
        strength: '400mg',
        price: 8.50,
        stockQuantity: 350,
        reorderLevel: 80,
        expiryDate: new Date('2026-03-15'),
        batchNumber: 'IBU-2024-003',
        sku: 'MED-IBU-400',
        rackLocation: 'A2',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine',
        category: 'Antihistamines',
        manufacturer: 'AllerFree',
        description: 'Antihistamine for allergies',
        dosageForm: 'Tablet',
        strength: '10mg',
        price: 6.75,
        stockQuantity: 8,
        reorderLevel: 50,
        expiryDate: new Date('2026-09-20'),
        batchNumber: 'CET-2024-004',
        sku: 'MED-CET-010',
        rackLocation: 'C1',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Metformin 500mg',
        genericName: 'Metformin',
        category: 'Diabetes',
        manufacturer: 'DiabCare',
        description: 'Diabetes medication',
        dosageForm: 'Tablet',
        strength: '500mg',
        price: 15.00,
        stockQuantity: 150,
        reorderLevel: 40,
        expiryDate: new Date('2027-11-30'),
        batchNumber: 'MET-2024-005',
        sku: 'MED-MET-500',
        rackLocation: 'D1',
        isPrescriptionRequired: true,
        status: 'active'
      },
      {
        name: 'Omeprazole 20mg',
        genericName: 'Omeprazole',
        category: 'Gastrointestinal',
        manufacturer: 'GastroCare',
        description: 'Proton pump inhibitor for acid reflux',
        dosageForm: 'Capsule',
        strength: '20mg',
        price: 10.50,
        stockQuantity: 180,
        reorderLevel: 60,
        expiryDate: new Date('2027-08-15'),
        batchNumber: 'OME-2024-006',
        sku: 'MED-OME-020',
        rackLocation: 'E1',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Atorvastatin 10mg',
        genericName: 'Atorvastatin',
        category: 'Cardiovascular',
        manufacturer: 'HeartHealth',
        description: 'Cholesterol-lowering medication',
        dosageForm: 'Tablet',
        strength: '10mg',
        price: 18.00,
        stockQuantity: 120,
        reorderLevel: 30,
        expiryDate: new Date('2027-10-30'),
        batchNumber: 'ATO-2024-007',
        sku: 'MED-ATO-010',
        rackLocation: 'F1',
        isPrescriptionRequired: true,
        status: 'active'
      },
      {
        name: 'Vitamin D3 1000IU',
        genericName: 'Cholecalciferol',
        category: 'Vitamins & Supplements',
        manufacturer: 'VitaLife',
        description: 'Vitamin D supplement',
        dosageForm: 'Capsule',
        strength: '1000IU',
        price: 12.00,
        stockQuantity: 300,
        reorderLevel: 70,
        expiryDate: new Date('2026-12-31'),
        batchNumber: 'VIT-2024-008',
        sku: 'MED-VITD-1000',
        rackLocation: 'G1',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Aspirin 75mg',
        genericName: 'Acetylsalicylic Acid',
        category: 'Cardiovascular',
        manufacturer: 'CardioMed',
        description: 'Blood thinner',
        dosageForm: 'Tablet',
        strength: '75mg',
        price: 4.50,
        stockQuantity: 5,
        reorderLevel: 100,
        expiryDate: new Date('2026-05-15'),
        batchNumber: 'ASP-2024-009',
        sku: 'MED-ASP-075',
        rackLocation: 'A3',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Salbutamol Inhaler',
        genericName: 'Salbutamol',
        category: 'Respiratory',
        manufacturer: 'BreatheWell',
        description: 'Asthma relief inhaler',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        price: 25.00,
        stockQuantity: 75,
        reorderLevel: 20,
        expiryDate: new Date('2027-07-31'),
        batchNumber: 'SAL-2024-010',
        sku: 'MED-SAL-INH',
        rackLocation: 'H1',
        isPrescriptionRequired: true,
        status: 'active'
      },
      {
        name: 'Hydrocortisone Cream',
        genericName: 'Hydrocortisone',
        category: 'Skin Care',
        manufacturer: 'DermaCare',
        description: 'Anti-inflammatory skin cream',
        dosageForm: 'Cream',
        strength: '1%',
        price: 8.00,
        stockQuantity: 90,
        reorderLevel: 25,
        expiryDate: new Date('2026-04-30'),
        batchNumber: 'HYD-2024-011',
        sku: 'MED-HYD-CRM',
        rackLocation: 'I1',
        isPrescriptionRequired: false,
        status: 'active'
      },
      {
        name: 'Azithromycin 250mg',
        genericName: 'Azithromycin',
        category: 'Antibiotics',
        manufacturer: 'MedLife',
        description: 'Macrolide antibiotic',
        dosageForm: 'Tablet',
        strength: '250mg',
        price: 20.00,
        stockQuantity: 0,
        reorderLevel: 40,
        expiryDate: new Date('2027-09-30'),
        batchNumber: 'AZI-2024-012',
        sku: 'MED-AZI-250',
        rackLocation: 'B3',
        isPrescriptionRequired: true,
        status: 'active'
      }
    ]);

    console.log(`Created ${medicines.length} medicines`);

    // Create suppliers
    console.log('Creating suppliers...');
    const suppliers = await Supplier.create([
      {
        name: 'PharmaCorp Distributors',
        contactPerson: 'Rajesh Kumar',
        email: 'sales@pharmacorp.com',
        phone: '9876543210',
        address: { street: '100 Industrial Area', city: 'Mumbai', state: 'Maharashtra', zipCode: '400001', country: 'India' },
        gstNumber: '27AABCP1234E1ZV',
        licenseNumber: 'DL-MH-001234',
        paymentTerms: 'net_30',
        status: 'active',
        notes: 'Primary supplier for analgesics and general medicines',
        createdBy: users[0]._id
      },
      {
        name: 'MedLife Pharmaceuticals',
        contactPerson: 'Priya Sharma',
        email: 'orders@medlife.in',
        phone: '9876543211',
        address: { street: '45 Pharma Park', city: 'Hyderabad', state: 'Telangana', zipCode: '500032', country: 'India' },
        gstNumber: '36AABCM5678F1ZW',
        licenseNumber: 'DL-TS-005678',
        paymentTerms: 'net_60',
        status: 'active',
        notes: 'Antibiotics and specialty medicines',
        createdBy: users[0]._id
      },
      {
        name: 'VitaLife Health Supplies',
        contactPerson: 'Amit Patel',
        email: 'supply@vitalife.com',
        phone: '9876543212',
        address: { street: '78 Wellness Blvd', city: 'Ahmedabad', state: 'Gujarat', zipCode: '380001', country: 'India' },
        gstNumber: '24AABCV9012G1ZX',
        licenseNumber: 'DL-GJ-009012',
        paymentTerms: 'net_15',
        status: 'active',
        notes: 'Vitamins, supplements, and skin care products',
        createdBy: users[0]._id
      }
    ]);

    console.log(`Created ${suppliers.length} suppliers`);

    // Create batches for first few medicines
    console.log('Creating batches...');
    const batchData = [];
    for (let i = 0; i < Math.min(6, medicines.length); i++) {
      const med = medicines[i];
      const halfQty = Math.floor(med.stockQuantity / 2);
      const remainQty = med.stockQuantity - halfQty;

      batchData.push({
        medicine: med._id,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        quantity: halfQty,
        initialQuantity: halfQty,
        costPrice: Math.round(med.price * 0.6 * 100) / 100,
        supplier: suppliers[i % suppliers.length]._id,
        rackLocation: med.rackLocation,
        status: 'active',
        receivedBy: users[0]._id,
        receivedDate: new Date('2026-01-15')
      });

      // Second batch with slightly different batch number and later expiry
      batchData.push({
        medicine: med._id,
        batchNumber: `${med.batchNumber}-B`,
        expiryDate: new Date(new Date(med.expiryDate).getTime() + 90 * 24 * 60 * 60 * 1000),
        quantity: remainQty,
        initialQuantity: remainQty,
        costPrice: Math.round(med.price * 0.65 * 100) / 100,
        supplier: suppliers[(i + 1) % suppliers.length]._id,
        rackLocation: med.rackLocation,
        status: 'active',
        receivedBy: users[1]._id,
        receivedDate: new Date('2026-02-01')
      });
    }

    const batches = await Batch.create(batchData);
    console.log(`Created ${batches.length} batches`);

    console.log('\n=== Seed Data Summary ===');
    console.log('\nUsers Created:');
    console.log('Admin: admin@pharmacy.com / Admin@123');
    console.log('Pharmacist: pharmacist@pharmacy.com / Pharma@123');
    console.log('Customer: customer@pharmacy.com / Customer@123');
    console.log(`\nMedicines Created: ${medicines.length}`);
    console.log(`Suppliers Created: ${suppliers.length}`);
    console.log(`Batches Created: ${batches.length}`);
    console.log('\nNote: Some medicines have low/zero stock for testing alerts');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
