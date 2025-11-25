// Main EPIC viewer logic using jQuery
$(document).ready(function () {
  const $gallery = $('#gallery');
  const $spinner = $('#spinner');
  const $status = $('#status-message');
  const $dateInput = $('#date-input');
  const $apiKeyInput = $('#api-key');

  // Set max attribute to today for date input
  const today = new Date().toISOString().split('T')[0];
  $dateInput.attr('max', today);

  // Utility: format date into YYYY/MM/DD for image URL
  const buildImageUrl = (dateString, imageId) => {
    const [year, month, day] = dateString.split(' ')[0].split('-');
    return `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${imageId}.png`;
  };

  // Update status text with optional error styling
  const setStatus = (message, isError = false) => {
    $status.text(message);
    $status.toggleClass('error', isError);
  };

  // Toggle spinner visibility
  const toggleSpinner = (show) => {
    $spinner.css('display', show ? 'inline-block' : 'none');
    $spinner.attr('aria-hidden', show ? 'false' : 'true');
  };

  // Render EPIC cards into the gallery
  const renderGallery = (items) => {
    $gallery.empty();

    if (!items.length) {
      setStatus('No images available for this date. Try another day or remove the date filter.');
      return;
    }

    items.forEach((item) => {
      const imageUrl = buildImageUrl(item.date, item.image);
      const readableDate = new Date(item.date).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const $card = $('<article>', { class: 'card' });
      const $img = $('<img>', {
        src: imageUrl,
        alt: item.caption || 'EPIC Earth image'
      });

      const $body = $('<div>', { class: 'card-body' });
      const $title = $('<h3>').text(readableDate);
      const $caption = $('<p>', { class: 'caption' }).text(item.caption || 'No caption provided.');
      const $meta = $('<div>', { class: 'meta' }).text(`Identifier: ${item.identifier}`);
      const $link = $('<a>', {
        class: 'link',
        href: imageUrl,
        target: '_blank',
        rel: 'noopener noreferrer'
      }).text('View full size →');

      $body.append($title, $caption, $meta, $link);
      $card.append($img, $body);
      $gallery.append($card);
    });

    setStatus(`Loaded ${items.length} image${items.length > 1 ? 's' : ''}.`);
  };

  // Fetch EPIC images via AJAX
  const fetchImages = () => {
    const apiKey = $apiKeyInput.val().trim();
    const dateValue = $dateInput.val();

    if (!apiKey) {
      setStatus('Please enter a NASA API key to continue.', true);
      return;
    }

    let endpoint = `https://api.nasa.gov/EPIC/api/natural?api_key=${encodeURIComponent(apiKey)}`;
    if (dateValue) {
      endpoint = `https://api.nasa.gov/EPIC/api/natural/date/${dateValue}?api_key=${encodeURIComponent(apiKey)}`;
    }

    // Update UI before request
    toggleSpinner(true);
    setStatus(apiKey === 'DEMO_KEY' ? 'Loading... (using DEMO_KEY, which may be rate-limited)' : 'Loading images...');
    $gallery.empty();

    $.ajax({
      url: endpoint,
      method: 'GET',
      dataType: 'json'
    })
      .done((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          setStatus('No images available for this date. Try another day or remove the date filter.');
          return;
        }
        renderGallery(data);
      })
      .fail((jqXHR) => {
        let message = 'Request failed – please check your API key or try again.';
        if (jqXHR.status === 403) {
          message = 'Unauthorized: your API key may be invalid or has exceeded its limits.';
        }
        setStatus(message, true);
      })
      .always(() => {
        toggleSpinner(false);
      });
  };

  // Event listeners
  $('#load-images').on('click', fetchImages);
});
