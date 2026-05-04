/* Bomnous profile page: load/save via GET/PUT /users/profile */
(function () {
  "use strict";

  var NC_CITIES = ["", "Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele"];

  function getApiBase() {
    if (typeof window !== "undefined" && window.BOMNOUS_API_BASE !== undefined && window.BOMNOUS_API_BASE !== "") {
      return String(window.BOMNOUS_API_BASE).replace(/\/$/, "");
    }
    return "https://bomnous-shops-ecommerce-backend-production.up.railway.app";
  }

  function getToken() {
    try {
      return localStorage.getItem("bomnous_access_token") || "";
    } catch (e) {
      return "";
    }
  }

  function getDisplayInitial(name, username, email) {
    var s = (name && String(name).trim()) || (username && String(username).trim()) || "";
    if (s.length) {
      return s.charAt(0).toUpperCase();
    }
    if (email && String(email).indexOf("@") > 0) {
      return String(email).charAt(0).toUpperCase();
    }
    return "?";
  }

  function setHeaderAvatarFromPicOrInitial(picDataUrl, initial) {
    var wrap = document.getElementById("profile-header-avatar");
    if (!wrap) return;
    if (picDataUrl && String(picDataUrl).length > 20) {
      wrap.innerHTML =
        '<img src="' +
        picDataUrl.replace(/"/g, "&quot;") +
        '" class="profile-header-avatar-img" alt="Profile" />';
      return;
    }
    wrap.innerHTML =
      '<span class="profile-header-avatar-initial" aria-hidden="true">' + initial + "</span>";
  }

  function showToast() {
    var el = document.getElementById("profile-toast");
    if (!el || typeof bootstrap === "undefined" || !bootstrap.Toast) {
      return;
    }
    var t = bootstrap.Toast.getOrCreateInstance(el, { delay: 3600 });
    t.show();
  }

  function showError(msg) {
    var el = document.getElementById("profile-error");
    if (!el) return;
    el.textContent = msg || "Could not save.";
    el.classList.remove("d-none");
  }

  function hideError() {
    var el = document.getElementById("profile-error");
    if (!el) return;
    el.classList.add("d-none");
  }

  function setBioCount() {
    var bio = document.getElementById("profile-bio");
    var c = document.getElementById("profile-bio-count");
    if (!bio || !c) return;
    c.textContent = String((bio.value || "").length);
  }

  function fillCitySelect(value) {
    var sel = document.getElementById("profile-city");
    if (!sel) return;
    var v = value || "";
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === v) {
        sel.selectedIndex = i;
        return;
      }
    }
    sel.selectedIndex = 0;
  }

  var pendingPicDataUrl = null;
  var PROFILE_PIC_OWNER_KEY = "bomnous_profile_pic_owner";

  function setProfilePicWithOwner(dataUrl, username) {
    try {
      if (!dataUrl || String(dataUrl).length <= 40) {
        localStorage.removeItem("bomnous_profile_pic");
        localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
        return;
      }
      var u = String(username || "")
        .trim()
        .toLowerCase();
      localStorage.setItem("bomnous_profile_pic", dataUrl);
      if (u) {
        localStorage.setItem(PROFILE_PIC_OWNER_KEY, u);
      } else {
        localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
      }
    } catch (err) {
      throw err;
    }
  }

  function localStoredPicMatchesUser(username) {
    try {
      var pic = localStorage.getItem("bomnous_profile_pic");
      if (!pic || String(pic).length <= 40) {
        return false;
      }
      var owner = String(localStorage.getItem(PROFILE_PIC_OWNER_KEY) || "")
        .trim()
        .toLowerCase();
      var u = String(username || "")
        .trim()
        .toLowerCase();
      return Boolean(u && owner && owner === u);
    } catch (e) {
      return false;
    }
  }

  function clearStoredProfilePicIfStale(username) {
    try {
      if (pendingPicDataUrl) {
        return;
      }
      if (!localStoredPicMatchesUser(username)) {
        localStorage.removeItem("bomnous_profile_pic");
        localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function onFileChange(e) {
    var f = e.target && e.target.files && e.target.files[0];
    if (!f || !f.type || f.type.indexOf("image/") !== 0) {
      return;
    }
    if (f.size > 1_800_000) {
      showError("Please choose a smaller image (under ~1.8MB).");
      return;
    }
    hideError();
    var r = new FileReader();
    r.onload = function () {
      var dataUrl = String(r.result || "");
      pendingPicDataUrl = dataUrl;
      try {
        var unField = (document.getElementById("profile-username") || {}).value || "";
        setProfilePicWithOwner(dataUrl, unField);
      } catch (err) {
        showError("Image is too large for browser storage. Try a smaller file.");
        return;
      }
      var initial = getDisplayInitial(
        (document.getElementById("profile-full-name") || {}).value,
        (document.getElementById("profile-username") || {}).value,
        (document.getElementById("profile-email") || {}).value
      );
      setHeaderAvatarFromPicOrInitial(dataUrl, initial);
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("bomnous-profile-updated"));
      }
    };
    r.readAsDataURL(f);
  }

  function applySellerUI(role, shopId) {
    var card = document.getElementById("profile-seller-section");
    if (!card) return;
    if (role === "seller") {
      card.classList.remove("d-none");
      var shopLink = document.getElementById("profile-seller-shop-link");
      if (shopLink && shopId) {
        shopLink.setAttribute("href", "shop.html?id=" + encodeURIComponent(String(shopId)));
        shopLink.classList.remove("disabled", "pe-none", "text-muted");
        shopLink.innerHTML = 'View My Shop <i class="bi bi-arrow-right" aria-hidden="true"></i>';
      } else if (shopLink) {
        shopLink.setAttribute("href", "onboarding.html");
        shopLink.innerHTML = 'Set up your shop <i class="bi bi-arrow-right" aria-hidden="true"></i>';
      }
    } else {
      card.classList.add("d-none");
    }
  }

  function fetchMyShop() {
    var token = getToken();
    if (!token) return Promise.resolve(null);
    return fetch(getApiBase() + "/shops/my", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (res.status === 404) return { shop: null, role: "seller" };
        if (res.status === 403) return { shop: null, role: "buyer" };
        if (!res.ok) return { shop: null, role: null };
        return res.json().then(function (shop) {
          return { shop: shop, role: "seller" };
        });
      })
      .catch(function () {
        return { shop: null, role: null };
      });
  }

  function loadProfile() {
    var token = getToken();
    if (!token) {
      window.location.href = "auth.html?next=profile.html";
      return Promise.resolve();
    }
    hideError();
    return fetch(getApiBase() + "/users/profile", {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = "auth.html?next=profile.html";
          return null;
        }
        if (!res.ok) throw new Error("load");
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        var fn = document.getElementById("profile-full-name");
        var un = document.getElementById("profile-username");
        var em = document.getElementById("profile-email");
        var ph = document.getElementById("profile-phone");
        var bio = document.getElementById("profile-bio");
        if (fn) fn.value = data.full_name || "";
        if (un) un.value = data.username || "";
        if (em) em.value = data.email || "";
        if (ph) ph.value = data.phone || "";
        if (bio) bio.value = data.bio || "";
        fillCitySelect(data.city || "");

        try {
          localStorage.setItem("bomnous_username", data.username || "");
          if (data.email) {
            localStorage.setItem("bomnous_last_email", data.email);
          }
          if (data.full_name !== undefined && data.full_name !== null) {
            localStorage.setItem("bomnous_full_name", data.full_name || "");
          }
          if (data.role) localStorage.setItem("bomnous_role", data.role);
        } catch (e) {}

        clearStoredProfilePicIfStale(data.username);
        var pic = null;
        if (pendingPicDataUrl) {
          try {
            setProfilePicWithOwner(pendingPicDataUrl, data.username);
          } catch (ePic0) {
            /* ignore */
          }
          pic = pendingPicDataUrl;
        } else {
          try {
            if (localStoredPicMatchesUser(data.username)) {
              pic = localStorage.getItem("bomnous_profile_pic");
            }
          } catch (e0) {
            pic = null;
          }
          if (!pic && data.profile_picture) {
            try {
              setProfilePicWithOwner(data.profile_picture, data.username);
            } catch (e) {}
            pic = data.profile_picture;
          } else if (!pic) {
            pic = data.profile_picture || null;
          }
        }
        var initial = getDisplayInitial(
          (fn && fn.value) || data.full_name,
          data.username,
          data.email
        );
        document.getElementById("profile-display-name").textContent =
          (data.full_name && String(data.full_name).trim()) || data.username || "Member";
        var sub = document.getElementById("profile-sub-username");
        if (sub) sub.textContent = "@" + (data.username || "user");
        var roleEl = document.getElementById("profile-role-badge");
        if (roleEl) {
          var isSeller = data.role === "seller";
          roleEl.textContent = isSeller ? "Seller" : "Buyer";
          roleEl.className = "profile-role-badge " + (isSeller ? "is-seller" : "is-buyer");
        }
        setHeaderAvatarFromPicOrInitial(pic, initial);
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("bomnous-profile-updated"));
        }

        return fetchMyShop().then(function (shopInfo) {
          var role = (data && data.role) || "";
          var id = shopInfo && shopInfo.shop && shopInfo.shop.id;
          if (id) {
            try {
              localStorage.setItem("bomnous_shop_id", String(id));
            } catch (e) {}
          }
          applySellerUI(role, id);
        });
      })
      .catch(function () {
        showError("Could not load your profile. Is the API running?");
      });
  }

  function saveProfile() {
    var token = getToken();
    if (!token) {
      window.location.href = "auth.html?next=profile.html";
      return;
    }
    hideError();
    var payload = {
      full_name: (document.getElementById("profile-full-name") || {}).value || null,
      username: (document.getElementById("profile-username") || {}).value || null,
      email: (document.getElementById("profile-email") || {}).value || null,
      phone: (document.getElementById("profile-phone") || {}).value || null,
      city: (document.getElementById("profile-city") || {}).value || null,
      bio: (document.getElementById("profile-bio") || {}).value || null,
    };
    var keys = Object.keys(payload);
    for (var i = 0; i < keys.length; i++) {
      if (payload[keys[i]] === "") payload[keys[i]] = null;
    }
    var localPic = pendingPicDataUrl;
    if (!localPic) {
      try {
        var unSave = (document.getElementById("profile-username") || {}).value || "";
        if (localStoredPicMatchesUser(unSave)) {
          localPic = localStorage.getItem("bomnous_profile_pic");
        }
      } catch (e) {
        localPic = null;
      }
    }
    if (localPic) {
      payload.profile_picture = localPic;
    }

    return fetch(getApiBase() + "/users/profile", {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (res.status === 401) {
          window.location.href = "auth.html?next=profile.html";
          return;
        }
        if (!res.ok) {
          return res.json().then(
            function (b) {
              var d = (b && b.detail) || "Could not save.";
              if (Array.isArray(d)) d = d.map(function (x) { return x.msg || x; }).join(" ");
              throw new Error(typeof d === "string" ? d : "Could not save.");
            },
            function () {
              throw new Error("Could not save.");
            }
          );
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        try {
          if (data.username) localStorage.setItem("bomnous_username", data.username);
          if (data.full_name !== undefined) localStorage.setItem("bomnous_full_name", data.full_name || "");
          if (data.profile_picture) {
            setProfilePicWithOwner(data.profile_picture, data.username);
          }
        } catch (e) {}
        document.getElementById("profile-display-name").textContent =
          (data.full_name && String(data.full_name).trim()) || data.username || "Member";
        var sub = document.getElementById("profile-sub-username");
        if (sub) sub.textContent = "@" + (data.username || "user");
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("bomnous-profile-updated"));
        }
        pendingPicDataUrl = null;
        showToast();
      })
      .catch(function (err) {
        showError(err && err.message ? err.message : "Save failed.");
      });
  }

  function init() {
    var form = document.getElementById("profile-form");
    if (!form) return;

    var city = document.getElementById("profile-city");
    if (city && city.options.length === 0) {
      for (var j = 0; j < NC_CITIES.length; j++) {
        var o = document.createElement("option");
        o.value = NC_CITIES[j];
        o.textContent = NC_CITIES[j] === "" ? "Select city" : NC_CITIES[j];
        city.appendChild(o);
      }
    }

    var bio = document.getElementById("profile-bio");
    if (bio) {
      bio.addEventListener("input", setBioCount);
    }
    var file = document.getElementById("profile-pic-file");
    if (file) {
      file.addEventListener("change", onFileChange);
    }
    var editBtn = document.getElementById("profile-edit-header-btn");
    if (editBtn) {
      editBtn.addEventListener("click", function () {
        var section = document.getElementById("profile-form-section");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(function () {
          var first = document.getElementById("profile-full-name");
          if (first) first.focus();
        }, 400);
      });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveProfile();
    });

    var out = document.getElementById("profile-logout-btn");
    if (out) {
      out.addEventListener("click", function () {
        try {
          localStorage.removeItem("bomnous_logged_in");
          localStorage.removeItem("bomnous_access_token");
          localStorage.removeItem("bomnous_role");
          localStorage.removeItem("bomnous_username");
          localStorage.removeItem("bomnous_full_name");
          localStorage.removeItem("bomnous_profile_pic");
          localStorage.removeItem(PROFILE_PIC_OWNER_KEY);
          localStorage.removeItem("bomnous_shop_id");
          localStorage.removeItem("bomnous_user_id");
          localStorage.removeItem("bomnous_last_email");
        } catch (e) {}
        window.location.href = "index.html";
      });
    }

    loadProfile().then(function () {
      setBioCount();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
