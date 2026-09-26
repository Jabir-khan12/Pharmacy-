import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import Batch from '../models/Batch.js';
import Notification from '../models/Notification.js';
import StockTransaction from '../models/StockTransaction.js';
import Prescription from '../models/Prescription.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Sale from '../models/Sale.js';
import Return from '../models/Return.js';
import connectDB from '../config/db.js';

dotenv.config();

const QA_COUNT = 10;
const QA_PREFIX = 'QA-2026-';

const run = async () => {
  try {
    await connectDB();

    const admin = await User.findOne({ email: 'admin@pharmacy.com' });
    const pharmacist = await User.findOne({ email: 'pharmacist@pharmacy.com' });
    const medicines = await Medicine.find().sort({ createdAt: 1 }).limit(QA_COUNT);
    const suppliers = await Supplier.find().sort({ createdAt: 1 }).limit(QA_COUNT);

    if (!admin || !pharmacist || medicines.length < QA_COUNT || suppliers.length === 0) {
      throw new Error('Run npm run seed first so the demo users, medicines, and suppliers exist.');
    }

      await User.deleteMany({ email: /^qa\+2026-/ });

      const customers = await User.create(Array.from({ length: QA_COUNT }, (_, index) => ({
          email: `qa+2026-${String(index + 1).padStart(2, '0')}@pharmacy.test`,
          password: 'QaTest@123',
          role: 'customer',
          firstName: `QA${index + 1}`,
          lastName: 'Customer',
          phone: `900000${String(index + 1).padStart(4, '0')}`,
          address: {
            street: `${index + 1} Test Street`,
            city: 'QA City',
            state: 'QA',
            zipCode: `100${String(index + 1).padStart(2, '0')}`,
            country: 'USA'
          }
        })));

    await Promise.all([
      Batch.deleteMany({ batchNumber: new RegExp(`^${QA_PREFIX}BATCH-`) }),
      Notification.deleteMany({ title: new RegExp(`^${QA_PREFIX}`) }),
      StockTransaction.deleteMany({ notes: new RegExp(`^${QA_PREFIX}`) }),
      Prescription.deleteMany({ prescriptionNumber: new RegExp(`^${QA_PREFIX}RX-`) }),
      PurchaseOrder.deleteMany({ poNumber: new RegExp(`^${QA_PREFIX}PO-`) }),
      Sale.deleteMany({ orderNumber: new RegExp(`^${QA_PREFIX}SALE-`) }),
        Return.deleteMany({ returnNumber: new RegExp(`^${QA_PREFIX}RET-`) }),
        Medicine.deleteMany({ sku: new RegExp(`^${QA_PREFIX}SKU-`) }),
        Supplier.deleteMany({ name: new RegExp(`^${QA_PREFIX}Supplier`) })
    ]);

    const qaSuppliers = await Supplier.create(Array.from({ length: QA_COUNT }, (_, index) => ({
      name: `${QA_PREFIX}Supplier ${index + 1}`,
      contactPerson: `QA Contact ${index + 1}`,
      email: `qa-supplier-${index + 1}@pharmacy.test`,
      phone: `910000${String(index + 1).padStart(4, '0')}`,
      address: {
        street: `${index + 1} Supply Road`,
        city: 'QA City',
        state: 'QA',
        zipCode: `200${String(index + 1).padStart(2, '0')}`,
        country: 'USA'
      },
      gstNumber: `${QA_PREFIX}GST-${index + 1}`,
      licenseNumber: `${QA_PREFIX}LIC-${index + 1}`,
      paymentTerms: ['immediate', 'net_15', 'net_30', 'net_60'][index % 4],
      status: index === 9 ? 'inactive' : 'active',
      notes: `${QA_PREFIX} deterministic supplier record`,
      createdBy: admin._id
    })));

    const qaMedicines = await Medicine.create(Array.from({ length: QA_COUNT }, (_, index) => ({
      name: `${QA_PREFIX}Medicine ${index + 1}`,
      genericName: `${QA_PREFIX}Generic ${index + 1}`,
      category: ['Analgesics', 'Antibiotics', 'Antivirals', 'Antifungals', 'Antihistamines'][index % 5],
      manufacturer: `${QA_PREFIX}Manufacturer ${index + 1}`,
      description: `${QA_PREFIX} deterministic medicine record`,
      dosageForm: ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Inhaler'][index % 5],
      strength: `${50 + index * 10}mg`,
      price: 5 + index * 2.5,
      stockQuantity: index === 9 ? 0 : 100 + index * 10,
      reorderLevel: 20 + index,
      expiryDate: new Date(2027, index % 12, 15),
      batchNumber: `${QA_PREFIX}MED-${String(index + 1).padStart(2, '0')}`,
      sku: `${QA_PREFIX}SKU-${String(index + 1).padStart(2, '0')}`,
      rackLocation: `QA-${String(index + 1).padStart(2, '0')}`,
      isPrescriptionRequired: index % 2 === 0,
      status: 'active'
    })));

    const qaBatches = await Batch.create(qaMedicines.map((medicine, index) => ({
      medicine: medicine._id,
      batchNumber: `${QA_PREFIX}BATCH-${String(index + 1).padStart(2, '0')}`,
      expiryDate: medicine.expiryDate,
      quantity: 50 + index,
      initialQuantity: 50 + index,
      costPrice: Math.round(medicine.price * 0.6 * 100) / 100,
      supplier: qaSuppliers[index]._id,
      rackLocation: medicine.rackLocation,
      status: 'active',
      receivedBy: pharmacist._id,
      receivedDate: new Date(2026, 0, index + 1),
      notes: `${QA_PREFIX} deterministic batch record`
    })));

    const qaPurchaseOrders = await PurchaseOrder.create(qaMedicines.map((medicine, index) => {
      const quantity = 20 + index;
      const unitCost = Math.round(medicine.price * 0.55 * 100) / 100;
      return {
        poNumber: `${QA_PREFIX}PO-${String(index + 1).padStart(2, '0')}`,
        supplier: qaSuppliers[index]._id,
        items: [{
          medicine: medicine._id,
          medicineName: medicine.name,
          quantity,
          unitCost,
          subtotal: quantity * unitCost,
          receivedQuantity: index % 3 === 0 ? quantity : 0,
          batchNumber: qaBatches[index].batchNumber,
          expiryDate: medicine.expiryDate
        }],
        totalAmount: quantity * unitCost,
        status: ['draft', 'ordered', 'partially_received', 'received'][index % 4],
        orderDate: new Date(2026, 1, index + 1),
        expectedDeliveryDate: new Date(2026, 2, index + 1),
        createdBy: admin._id,
        receivedBy: index % 3 === 0 ? pharmacist._id : undefined,
        notes: `${QA_PREFIX} deterministic purchase order`
      };
    }));

    const qaPrescriptions = await Prescription.create(qaMedicines.map((medicine, index) => ({
      prescriptionNumber: `${QA_PREFIX}RX-${String(index + 1).padStart(2, '0')}`,
      customer: customers[index]._id,
      doctorName: `QA Doctor ${index + 1}`,
      doctorContact: `920000${String(index + 1).padStart(4, '0')}`,
      uploadedFile: `qa-prescription-${String(index + 1).padStart(2, '0')}.pdf`,
      prescribedMedicines: [{
        medicineName: medicine.name,
        dosage: '1 tablet daily',
        duration: '30 days',
        instructions: 'Take after food'
      }],
      status: ['pending', 'verified', 'fulfilled', 'rejected'][index % 4],
      verifiedBy: index % 4 === 0 ? null : pharmacist._id,
      verifiedAt: index % 4 === 0 ? null : new Date(2026, 1, index + 1),
      expiryDate: new Date(2027, 6, index + 1)
    })));

    const qaSales = await Sale.create(qaMedicines.map((medicine, index) => {
      const quantity = 1 + (index % 3);
      const total = medicine.price * quantity;
      return {
        orderNumber: `${QA_PREFIX}SALE-${String(index + 1).padStart(2, '0')}`,
        customer: {
          userId: customers[index]._id,
          name: `${customers[index].firstName} ${customers[index].lastName}`,
          phone: customers[index].phone,
          email: customers[index].email
        },
        pharmacist: pharmacist._id,
        items: [{
          medicine: medicine._id,
          medicineName: medicine.name,
          quantity,
          priceAtSale: medicine.price,
          subtotal: total
        }],
        totalAmount: total,
        grandTotal: total,
        paymentMethod: ['cash', 'card', 'insurance', 'online'][index % 4],
        prescription: qaPrescriptions[index]._id,
        status: index === 9 ? 'partially_returned' : 'completed',
        notes: `${QA_PREFIX} deterministic sale`
      };
    }));

    const qaReturns = await Return.create(qaSales.map((sale, index) => ({
      returnNumber: `${QA_PREFIX}RET-${String(index + 1).padStart(2, '0')}`,
      originalSale: sale._id,
      returnedBy: customers[index]._id,
      items: [{
        medicine: qaMedicines[index]. _id,
        medicineName: qaMedicines[index].name,
        quantity: 1,
        priceAtSale: qaMedicines[index].price,
        reason: ['Damaged packaging', 'Wrong item', 'Customer changed mind'][index % 3],
        restockable: index % 3 !== 0
      }],
      refundAmount: qaMedicines[index].price,
      status: ['pending', 'approved', 'rejected'][index % 3],
      approvedBy: index % 3 === 1 ? admin._id : null,
      approvedAt: index % 3 === 1 ? new Date(2026, 2, index + 1) : null,
      approvalNotes: index % 3 === 1 ? `${QA_PREFIX} approved test return` : undefined
    })));

    await Notification.create(qaMedicines.map((medicine, index) => ({
      type: ['low_stock', 'expiry_alert', 'system'][index % 3],
      medicine: medicine._id,
      title: `${QA_PREFIX} Notification ${index + 1}`,
      message: `${QA_PREFIX} notification for ${medicine.name}`,
      priority: ['low', 'medium', 'high', 'urgent'][index % 4],
      isRead: index % 2 === 0,
      targetRoles: index % 2 === 0 ? ['admin', 'pharmacist'] : ['admin']
    })));

    await StockTransaction.create(qaMedicines.map((medicine, index) => ({
      medicine: medicine._id,
      type: ['purchase', 'sale', 'return', 'adjustment', 'damage'][index % 5],
      quantity: index % 5 === 4 ? -1 : 1 + index,
      balanceAfter: Math.max(0, medicine.stockQuantity - index),
      performedBy: pharmacist._id,
      referenceId: index % 2 === 0 ? qaSales[index]._id : qaReturns[index]._id,
      referenceModel: index % 2 === 0 ? 'Sale' : 'Return',
      notes: `${QA_PREFIX} stock transaction ${index + 1}`
    })));

    console.log('\n=== QA Seed Summary ===');
    console.log(`QA users: ${customers.length} (password: QaTest@123)`);
    console.log(`QA suppliers: ${qaSuppliers.length}`);
    console.log(`QA medicines: ${qaMedicines.length}`);
    console.log(`QA batches: ${qaBatches.length}`);
    console.log(`QA purchase orders: ${qaPurchaseOrders.length}`);
    console.log(`QA prescriptions: ${qaPrescriptions.length}`);
    console.log(`QA sales: ${qaSales.length}`);
    console.log(`QA returns: ${qaReturns.length}`);
    console.log('QA notifications: 10');
    console.log('QA stock transactions: 10');
  } catch (error) {
    console.error('Error seeding QA data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
