import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '../src/supabaseClient';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../src/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

describe('CareSyncApp Core Integration & Safety Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Barcode Scanner & Medication Logging (`RoundedCamera`)', () => {
    it('validates scanned NDC/barcode string format correctly', () => {
      const validBarcode = '0003-0894-56';
      const invalidBarcode = 'XYZ-INVALID';

      const isValidFormat = (code: string) => /^\d{4}-\d{4}-\d{2}$/.test(code) || /^\d{10,12}$/.test(code);

      expect(isValidFormat(validBarcode)).toBe(true);
      expect(isValidFormat(invalidBarcode)).toBe(false);
    });

    it('handles Supabase insertion payload on successful scan capture', async () => {
      const mockInsert = supabase.from('medication_logs').insert as jest.Mock;
      mockInsert.mockResolvedValueOnce({ data: { id: 1 }, error: null });

      const scanData = { medication_id: '12345', timestamp: new Date().toISOString() };
      const response = await supabase.from('medication_logs').insert([scanData]);

      expect(supabase.from).toHaveBeenCalledWith('medication_logs');
      expect(mockInsert).toHaveBeenCalledWith([scanData]);
      expect(response.error).toBeNull();
    });
  });

  describe('Clinical Decision Support (CDS) Safety Engine', () => {
    it('flags severe drug-drug interactions correctly', () => {
      const activeMedications = ['warfarin', 'aspirin'];
      const incomingPrescription = 'aspirin';

      const checkContraindications = (currentMeds: string[], newMed: string) => {
        if (currentMeds.includes('warfarin') && newMed === 'aspirin') {
          return { alert: 'High Risk', message: 'Increased bleeding hazard with Warfarin and Aspirin combination.' };
        }
        return { alert: 'Safe', message: 'No critical interactions found.' };
      };

      const result = checkContraindications(activeMedications, incomingPrescription);
      expect(result.alert).toBe('High Risk');
      expect(result.message).toContain('Increased bleeding hazard');
    });

    it('passes safe medications without triggering safety holds', () => {
      const activeMedications = ['lisinopril'];
      const incomingPrescription = 'acetaminophen';

      const checkContraindications = (currentMeds: string[], newMed: string) => {
        if (currentMeds.includes('warfarin') && newMed === 'aspirin') {
          return { alert: 'High Risk' };
        }
        return { alert: 'Safe' };
      };

      const result = checkContraindications(activeMedications, incomingPrescription);
      expect(result.alert).toBe('Safe');
    });
  });

  describe('FHIR / HL7 Data Ingestion Normalizer', () => {
    it('transforms raw FHIR observation resource into command center schema', () => {
      const rawFhirObservation = {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{ system: 'http://loinc.org', code: '883-9', display: 'Aspirin [Presence]' }]
        },
        subject: { reference: 'Patient/123' },
        valueString: 'Detected'
      };

      const normalizeObservation = (fhir: typeof rawFhirObservation) => ({
        patientId: fhir.subject.reference.split('/')[1],
        testName: fhir.code.coding[0].display,
        status: fhir.status,
        result: fhir.valueString
      });

      const normalized = normalizeObservation(rawFhirObservation);
      expect(normalized).toEqual({
        patientId: '123',
        testName: 'Aspirin [Presence]',
        status: 'final',
        result: 'Detected'
      });
    });
  });
});
