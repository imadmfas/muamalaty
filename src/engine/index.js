// Reconstructed from Metro module 725 (decompiled.js lines 277849–278134)
// Adapter between the zustand store state and the procedural-twin engine.

import { ProceduralGraphBuilder } from './graphBuilder';
import { INITIAL_SERVICES } from '../data/servicesData';

export class StoreAdapter {
  static mapStoreStateToInput(state) {
    const documents = [];
    const today = new Date();
    const familyHead = state.familyHead;
    let userAge = undefined;

    if (familyHead) {
      let age = undefined;
      if (familyHead.birthDate) {
        const birth = new Date(familyHead.birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age = age - 1;
        }
      }

      if (familyHead.nidExpiryDate) {
        documents.push({
          type: 'nid',
          label: 'البطاقة الوطنية الموحدة',
          expiryDate: familyHead.nidExpiryDate,
          isValid: familyHead.nidExpiryDate
            ? new Date(familyHead.nidExpiryDate).getTime() > today.getTime()
            : false,
          documentNumber: familyHead.nidNumber,
        });
      }

      if (familyHead.passportExpiryDate) {
        documents.push({
          type: 'passport',
          label: 'جواز سفر لرب العائلة',
          expiryDate: familyHead.passportExpiryDate,
          isValid: familyHead.passportExpiryDate
            ? new Date(familyHead.passportExpiryDate).getTime() > today.getTime()
            : false,
          documentNumber: familyHead.passportNumber,
        });
      }

      if (familyHead.housingExpiryDate) {
        documents.push({
          type: 'housing',
          label: 'بطاقة السكن',
          expiryDate: familyHead.housingExpiryDate,
          isValid: familyHead.housingExpiryDate
            ? new Date(familyHead.housingExpiryDate).getTime() > today.getTime()
            : false,
          documentNumber: familyHead.housingNumber,
        });
      }

      userAge = age;
    }

    if (state.drivingLicenseExpiry) {
      documents.push({
        type: 'driving',
        label: 'إجازة السوق',
        expiryDate: state.drivingLicenseExpiry,
        isValid: state.drivingLicenseExpiry
          ? new Date(state.drivingLicenseExpiry).getTime() > today.getTime()
          : false,
      });
    }

    if (state.vehicleAnnualExpiry) {
      documents.push({
        type: 'vehicle',
        label: 'سنوية السيارة',
        expiryDate: state.vehicleAnnualExpiry,
        isValid: state.vehicleAnnualExpiry
          ? new Date(state.vehicleAnnualExpiry).getTime() > today.getTime()
          : false,
      });
    }

    if (state.rationCardUpdate) {
      documents.push({
        type: 'ration',
        label: 'البطاقة التموينية',
        expiryDate: state.rationCardUpdate,
        isValid: state.rationCardUpdate
          ? new Date(state.rationCardUpdate).getTime() > today.getTime()
          : false,
      });
    }

    return {
      userAge,
      governorate: state.selectedGovernorate || 'بغداد',
      district: state.selectedDistrict || 'الرصافة',
      documents,
      services: INITIAL_SERVICES,
    };
  }

  static buildGraphFromStore(state) {
    const input = this.mapStoreStateToInput(state);
    return ProceduralGraphBuilder.build(input);
  }
}
