document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const addressForm = document.getElementById('addressForm');
  const countryCodeSelect = document.getElementById('countryCode');
  const streetLine1Input = document.getElementById('streetLine1');
  const streetLine2Input = document.getElementById('streetLine2');
  const cityInput = document.getElementById('city');
  const stateProvinceInput = document.getElementById('stateProvince');
  const postalCodeInput = document.getElementById('postalCode');

  const btnValidate = document.getElementById('btnValidate');
  const btnSave = document.getElementById('btnSave');
  const validateSpinner = document.getElementById('validateSpinner');
  const validateIcon = document.getElementById('validateIcon');
  const saveSpinner = document.getElementById('saveSpinner');

  const validationResultPlaceholder = document.getElementById('validationResultPlaceholder');
  const validationResultCard = document.getElementById('validationResultCard');
  const resultHeader = document.getElementById('resultHeader');
  const resultStatusBadge = document.getElementById('resultStatusBadge');
  const resultNormalizedAddress = document.getElementById('resultNormalizedAddress');
  const resultValidatedBy = document.getElementById('resultValidatedBy');
  const resultRawResponse = document.getElementById('resultRawResponse');

  const historyPlaceholder = document.getElementById('historyPlaceholder');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');

  // Toasts
  const successToastEl = document.getElementById('successToast');
  const errorToastEl = document.getElementById('errorToast');
  const successToastBody = document.getElementById('successToastBody');
  const errorToastBody = document.getElementById('errorToastBody');

  const successToast = new bootstrap.Toast(successToastEl);
  const errorToast = new bootstrap.Toast(errorToastEl);

  // Cache last validated address to ensure integrity
  let validatedAddressData = null;

  // Initial Load
  loadHistory();

  // Country-specific placeholder adjustments
  countryCodeSelect.addEventListener('change', () => {
    const country = countryCodeSelect.value;
    if (country === 'US') {
      stateProvinceInput.placeholder = 'e.g., CA';
      postalCodeInput.placeholder = 'e.g., 94043';
    } else if (country === 'CA') {
      stateProvinceInput.placeholder = 'e.g., ON';
      postalCodeInput.placeholder = 'e.g., K1A 0B1';
    } else if (country === 'IN') {
      stateProvinceInput.placeholder = 'e.g., Delhi';
      postalCodeInput.placeholder = 'e.g., 110001';
    }
    resetValidationState();
  });

  // Input changes reset the validation state
  [streetLine1Input, streetLine2Input, cityInput, stateProvinceInput, postalCodeInput].forEach(input => {
    input.addEventListener('input', () => {
      resetValidationState();
    });
  });

  // Validate Address Action
  btnValidate.addEventListener('click', async () => {
    if (!validateFormFields()) {
      showToast(false, 'Please correct the highlighted validation errors.');
      return;
    }

    setLoadingState(btnValidate, validateSpinner, validateIcon, true);
    resetValidationState();

    const payload = getFormPayload();

    try {
      const response = await axios.post('/api/address/validate', payload);
      const data = response.data;

      if (data.success && data.valid) {
        showValidationResult(true, data);
        validatedAddressData = payload; // save valid address payload
        btnSave.disabled = false;
        showToast(true, 'Address validated successfully and is valid!');
      } else {
        showValidationResult(false, {
          message: data.message || 'Address not valid.'
        });
        showToast(false, data.message || 'Address validation failed: invalid address.');
      }
    } catch (error) {
      console.error(error);
      const message = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Network error or server failed to validate address.';
      
      showValidationResult(false, { message });
      showToast(false, message);
    } finally {
      setLoadingState(btnValidate, validateSpinner, validateIcon, false);
    }
  });

  // Save Address Action
  btnSave.addEventListener('click', async () => {
    if (!validatedAddressData) {
      showToast(false, 'Address validation must succeed before saving.');
      return;
    }

    // Double check that user hasn't tampered with fields since validating
    const currentPayload = getFormPayload();
    if (JSON.stringify(currentPayload) !== JSON.stringify(validatedAddressData)) {
      showToast(false, 'Address details modified. Please re-validate before saving.');
      resetValidationState();
      return;
    }

    setLoadingState(btnSave, saveSpinner, null, true);

    try {
      const response = await axios.post('/api/address/save', currentPayload);
      if (response.data.success) {
        showToast(true, response.data.message || 'Address saved successfully!');
        resetForm();
        loadHistory();
      }
    } catch (error) {
      console.error(error);
      const message = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Failed to save address.';
      showToast(false, message);
    } finally {
      setLoadingState(btnSave, saveSpinner, null, false);
    }
  });

  // Helper Functions

  function getFormPayload() {
    return {
      countryCode: countryCodeSelect.value,
      streetLine1: streetLine1Input.value.trim(),
      streetLine2: streetLine2Input.value.trim() || undefined,
      city: cityInput.value.trim(),
      stateProvince: stateProvinceInput.value.trim(),
      postalCode: postalCodeInput.value.trim()
    };
  }

  function validateFormFields() {
    let isValid = true;
    
    // Country
    if (!countryCodeSelect.value) {
      countryCodeSelect.classList.add('is-invalid');
      isValid = false;
    } else {
      countryCodeSelect.classList.remove('is-invalid');
    }

    // Street Line 1
    if (!streetLine1Input.value.trim()) {
      streetLine1Input.classList.add('is-invalid');
      isValid = false;
    } else {
      streetLine1Input.classList.remove('is-invalid');
    }

    // City
    if (!cityInput.value.trim()) {
      cityInput.classList.add('is-invalid');
      isValid = false;
    } else {
      cityInput.classList.remove('is-invalid');
    }

    // State / Province
    if (!stateProvinceInput.value.trim()) {
      stateProvinceInput.classList.add('is-invalid');
      isValid = false;
    } else {
      stateProvinceInput.classList.remove('is-invalid');
    }

    // Postal Code
    if (!postalCodeInput.value.trim()) {
      postalCodeInput.classList.add('is-invalid');
      isValid = false;
    } else {
      postalCodeInput.classList.remove('is-invalid');
    }

    return isValid;
  }

  function resetValidationState() {
    validatedAddressData = null;
    btnSave.disabled = true;
    
    validationResultPlaceholder.classList.remove('d-none');
    validationResultCard.classList.add('d-none');
  }

  function resetForm() {
    addressForm.reset();
    resetValidationState();
    // remove invalid highlight classes
    [countryCodeSelect, streetLine1Input, cityInput, stateProvinceInput, postalCodeInput].forEach(el => {
      el.classList.remove('is-invalid');
    });
  }

  function setLoadingState(button, spinner, icon, isLoading) {
    button.disabled = isLoading;
    if (isLoading) {
      spinner.classList.remove('d-none');
      if (icon) icon.classList.add('d-none');
    } else {
      spinner.classList.add('d-none');
      if (icon) icon.classList.remove('d-none');
    }
  }

  function showValidationResult(isValid, data) {
    validationResultPlaceholder.classList.add('d-none');
    validationResultCard.classList.remove('d-none');

    validationResultCard.classList.remove('valid', 'invalid');

    if (isValid) {
      validationResultCard.classList.add('valid');
      resultHeader.textContent = 'Address Validated';
      
      resultStatusBadge.textContent = 'VALID';
      resultStatusBadge.className = 'badge bg-success';

      resultNormalizedAddress.textContent = data.normalizedAddress;
      resultValidatedBy.textContent = data.validatedBy;
      
      // Add dynamic badge color
      resultValidatedBy.className = 'badge badge-service';
      if (data.validatedBy === 'USPS') resultValidatedBy.classList.add('badge-usps');
      if (data.validatedBy === 'Canada Post') resultValidatedBy.classList.add('badge-canpost');
      if (data.validatedBy === 'OpenStreetMap') resultValidatedBy.classList.add('badge-osm');

      resultRawResponse.textContent = JSON.stringify(data.rawResponse, null, 2);
    } else {
      validationResultCard.classList.add('invalid');
      resultHeader.textContent = 'Validation Failed';

      resultStatusBadge.textContent = 'INVALID';
      resultStatusBadge.className = 'badge bg-danger';

      resultNormalizedAddress.textContent = data.message || 'The address details could not be validated.';
      resultValidatedBy.textContent = 'N/A';
      resultValidatedBy.className = 'badge bg-secondary';
      resultRawResponse.textContent = '{}';
    }
  }

  function showToast(isSuccess, message) {
    if (isSuccess) {
      successToastBody.textContent = message;
      successToast.show();
    } else {
      errorToastBody.textContent = message;
      errorToast.show();
    }
  }

  // Load Saved Address History
  async function loadHistory() {
    try {
      const response = await axios.get('/api/address/list');
      const addresses = response.data.addresses || [];

      historyCount.textContent = addresses.length;

      if (addresses.length === 0) {
        historyPlaceholder.classList.remove('d-none');
        historyList.classList.add('d-none');
        return;
      }

      historyPlaceholder.classList.add('d-none');
      historyList.classList.remove('d-none');

      historyList.innerHTML = '';
      addresses.forEach(addr => {
        const item = document.createElement('div');
        item.className = 'history-item d-flex justify-content-between align-items-start';
        
        let badgeClass = 'badge-usps';
        if (addr.validatedBy === 'Canada Post') badgeClass = 'badge-canpost';
        if (addr.validatedBy === 'OpenStreetMap') badgeClass = 'badge-osm';

        item.innerHTML = `
          <div>
            <div class="fw-medium text-light small">${addr.streetLine1}${addr.streetLine2 ? ', ' + addr.streetLine2 : ''}</div>
            <div class="text-secondary small mt-1">${addr.city}, ${addr.stateProvince} ${addr.postalCode}, ${addr.countryCode}</div>
            <div class="mt-2 d-flex align-items-center gap-2">
              <span class="badge ${badgeClass} badge-service">${addr.validatedBy}</span>
              <span class="text-muted" style="font-size: 0.75rem;">Normalized: ${addr.normalizedAddress}</span>
            </div>
          </div>
          <button class="btn-delete" title="Delete address" data-id="${addr.id}">
            <i class="bi bi-trash"></i>
          </button>
        `;

        // Attach delete listener
        const btnDelete = item.querySelector('.btn-delete');
        btnDelete.addEventListener('click', () => {
          deleteAddress(addr.id);
        });

        historyList.appendChild(item);
      });
    } catch (error) {
      console.error('Failed to load address history:', error);
    }
  }

  // Delete Address Function
  async function deleteAddress(id) {
    if (!confirm('Are you sure you want to delete this saved address?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/address/${id}`);
      if (response.data.success) {
        showToast(true, 'Address deleted successfully.');
        loadHistory();
      }
    } catch (error) {
      console.error(error);
      const message = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : 'Failed to delete address.';
      showToast(false, message);
    }
  }
});
