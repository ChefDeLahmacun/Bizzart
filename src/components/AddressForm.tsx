'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';

interface Address {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface AddressFormProps {
  addressForm: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  setAddressForm: React.Dispatch<React.SetStateAction<{
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  }>>;
  editingAddress: Address | null;
  addressLoading: boolean;
  handleAddAddress: (e: React.FormEvent) => void;
  handleEditAddress: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const AddressForm = memo(({
  addressForm,
  setAddressForm,
  editingAddress,
  addressLoading,
  handleAddAddress,
  handleEditAddress,
  onCancel
}: AddressFormProps) => {
  const t = useTranslations();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={editingAddress ? handleEditAddress : handleAddAddress} className="mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="line1" className="block text-sm font-medium text-gray-700">
            {t('address_line1')} *
          </label>
          <input
            type="text"
            id="line1"
            name="line1"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.line1}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="line2" className="block text-sm font-medium text-gray-700">
            {t('address_line2')}
          </label>
          <input
            type="text"
            id="line2"
            name="line2"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.line2}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            {t('city')} *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.city}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            {t('state')}
          </label>
          <input
            type="text"
            id="state"
            name="state"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.state}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            {t('postal_code')} *
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.postalCode}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            {t('country')} *
          </label>
          <input
            type="text"
            id="country"
            name="country"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.country}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t('phone')} *
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black sm:text-sm text-black"
            value={addressForm.phone}
            onChange={handleInputChange}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={addressLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {addressLoading ? t('saving') : editingAddress ? t('update_address') : t('add_address')}
        </button>
      </div>
    </form>
  );
});

AddressForm.displayName = 'AddressForm';

export default AddressForm;
