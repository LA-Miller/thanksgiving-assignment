// Simple EPIC viewer powered by jQuery + AJAX
$(document).ready(function () {
  const $apiKey = $('#apiKey');
  const $dateInput = $('#dateInput');
  const $loadBtn = $('#loadBtn');
  const $gallery = $('#gallery');
  const $statusMessage = $('#statusMessage');
  const $spinner = $('#spinner');

  // Initialize defaults
  $apiKey.val('DEMO_KEY');
  setStatus('Enter your API key and click Load Images to begin.', 'info');

  // Handle button click
  $loadBtn.on('click', function () {
    const apiKey = $apiKey.val().trim() || 'DEMO_KEY';
    const date = $dateInput.val();
    const baseUrl = 'https://api.nasa.gov/EPIC/api/natural';
    const endpoint = date ? `${baseUrl}/date/${date}` : baseUrl;

    $gallery.empty();
    showSpinner(true);
    setStatus('Fetching images from NASA EPIC...', 'info');

    $.ajax({
      url: endpoint,
      method: 'GET',
      data: { api_key: apiKey },
      dataType: 'json',
    })
      .done(function (data) {
        if (!data || data.length === 0) {
          setStatus('No images available for this date. Try another day or load the latest set.', 'error');
          return;
        }
        renderGallery(data);
        const keyNote = apiKey === 'DEMO_KEY'
          ? 'Loaded images with DEMO_KEY (requests may be rate limited).'
          : 'Images loaded successfully.';
        setStatus(keyNote, 'success');
      })
      .fail(function (jqXHR) {
        const errorText = jqXHR.responseJSON?.msg || 'Request failed – please check your API key or try again.';
        setStatus(errorText, 'error');
      })
      .always(function () {
        showSpinner(false);
      });
  });

  /**
   * Render gallery cards from the EPIC payload
   * @param {Array} items
   */
  function renderGallery(items) {
    $gallery.empty();

    items.forEach(function (item) {
      const date = item.date.split(' ')[0];
      const time = item.date.split(' ')[1] || '';
      const dateParts = date.split('-');
      // Validate date format: YYYY-MM-DD
      if (
        dateParts.length !== 3 ||
        !/^\d{4}$/.test(dateParts[0]) ||
        !/^\d{2}$/.test(dateParts[1]) ||
        !/^\d{2}$/.test(dateParts[2])
      ) {
        // Skip this item or show a placeholder/error card
        const $errorCard = $('<article>', { class: 'card error-card' });
        $errorCard.append(
          $('<div>', { class: 'card-content' }).append(
            $('<div>', { class: 'date', text: date + (time ? ' ' + time : '') }),
            $('<p>', { class: 'caption', text: 'Invalid date format. Image cannot be displayed.' })
          )
        );
        $gallery.append($errorCard);
        return;
      }
      const [year, month, day] = dateParts;
      const imageId = item.image;
      const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${imageId}.png`;

      const $card = $('<article>', { class: 'card' });
      const $img = $('<img>', {
        src: imageUrl,
        alt: item.caption || 'Earth image from EPIC',
        loading: 'lazy',
      });

      const $content = $('<div>', { class: 'card-content' });
      const $date = $('<div>', { class: 'date', text: `${date} ${time}` });
      const $caption = $('<p>', { class: 'caption', text: item.caption || 'No caption provided.' });
      const $meta = $('<div>', { class: 'meta', text: `Centroid coordinates: Lat ${item.centroid_coordinates.lat}, Lon ${item.centroid_coordinates.lon}` });
      const $actions = $('<div>', { class: 'actions' });
      const $link = $('<a>', {
        class: 'view-link',
        href: imageUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        text: 'View full size',
      });

      $actions.append($link);
      $content.append($date, $caption, $meta, $actions);
      $card.append($img, $content);
      $gallery.append($card);
    });
  }

  /**
   * Update the status message element
   * @param {string} text
   * @param {'info' | 'error' | 'success'} type
   */
  function setStatus(text, type) {
    $statusMessage.removeClass('info error success').addClass(`message ${type}`).text(text);
  }

  /**
   * Toggle the loading spinner visibility
   * @param {boolean} show
   */
  function showSpinner(show) {
    if (show) {
      $spinner.removeClass('hidden');
    } else {
      $spinner.addClass('hidden');
    }
  }
});
