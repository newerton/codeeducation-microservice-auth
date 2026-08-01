function getAccess(Auth, Current, role) {
  if (!Current.realm) return false;
  var realmAccess = Auth.user?.['realm_access'];
  if (realmAccess) {
    realmAccess = realmAccess[Current.realm.realm];
    if (realmAccess) {
      return realmAccess.indexOf(role) >= 0;
    }
  }
  return false;
}

function getAccessObject(Auth, Current) {
  return {
    get createRealm() {
      return Auth.user?.createRealm;
    },

    get queryUsers() {
      return getAccess(Auth, Current, 'query-users') || this.viewUsers;
    },

    get queryGroups() {
      return getAccess(Auth, Current, 'query-groups') || this.viewUsers;
    },

    get queryClients() {
      return getAccess(Auth, Current, 'query-clients') || this.viewClients;
    },

    get viewRealm() {
      return (
        getAccess(Auth, Current, 'view-realm') ||
        getAccess(Auth, Current, 'manage-realm') ||
        this.manageRealm
      );
    },

    get viewClients() {
      return (
        getAccess(Auth, Current, 'view-clients') ||
        getAccess(Auth, Current, 'manage-clients') ||
        this.manageClients
      );
    },

    get viewUsers() {
      return (
        getAccess(Auth, Current, 'view-users') ||
        getAccess(Auth, Current, 'manage-users') ||
        this.manageClients
      );
    },

    get viewEvents() {
      return (
        getAccess(Auth, Current, 'view-events') ||
        getAccess(Auth, Current, 'manage-events') ||
        this.manageClients
      );
    },

    get viewIdentityProviders() {
      return (
        getAccess(Auth, Current, 'view-identity-providers') ||
        getAccess(Auth, Current, 'manage-identity-providers') ||
        this.manageIdentityProviders
      );
    },

    get viewAuthorization() {
      return (
        getAccess(Auth, Current, 'view-authorization') ||
        this.manageAuthorization
      );
    },

    get manageRealm() {
      return getAccess(Auth, Current, 'manage-realm');
    },

    get manageClients() {
      return getAccess(Auth, Current, 'manage-clients');
    },

    get manageUsers() {
      return getAccess(Auth, Current, 'manage-users');
    },

    get manageEvents() {
      return getAccess(Auth, Current, 'manage-events');
    },

    get manageIdentityProviders() {
      return getAccess(Auth, Current, 'manage-identity-providers');
    },

    get manageAuthorization() {
      return getAccess(Auth, Current, 'manage-authorization');
    },

    get impersonation() {
      return getAccess(Auth, Current, 'impersonation');
    },
  };
}

module.controller(
  'GlobalCtrl',
  (
    $scope,
    _$http,
    Auth,
    Current,
    $location,
    _Notifications,
    ServerInfo,
    RealmSpecificLocalizationTexts,
  ) => {
    $scope.authUrl = authUrl;
    $scope.resourceUrl = resourceUrl;
    $scope.auth = Auth;
    $scope.serverInfo = ServerInfo.get();

    $scope.access = getAccessObject(Auth, Current);

    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.fragment = $location.path();
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.$watch(
      () => Current.realm,
      () => {
        if (Current.realm !== null && currentRealm !== Current.realm.id) {
          currentRealm = Current.realm.id;
          translateProvider.translations(locale, resourceBundle);
          RealmSpecificLocalizationTexts.get(
            { id: Current.realm.realm, locale: locale },
            (localizationTexts) => {
              translateProvider.translations(
                locale,
                localizationTexts.toJSON(),
              );
            },
          );
        }
      },
    );
  },
);

module.controller('HomeCtrl', (Realm, Auth, Current, $location) => {
  Realm.query(null, (realms) => {
    var realm;
    if (realms.length === 1) {
      realm = realms[0];
    } else if (realms.length === 2) {
      if (realms[0].realm === Auth.user.realm) {
        realm = realms[1];
      } else if (realms[1].realm === Auth.user.realm) {
        realm = realms[0];
      }
    }
    if (realm) {
      Current.realms = realms;
      Current.realm = realm;
      var access = getAccessObject(Auth, Current);
      if (access.viewRealm || access.manageRealm) {
        $location.url(`/realms/${realm.realm}`);
      } else if (access.queryClients) {
        $location.url(`/realms/${realm.realm}/clients`);
      } else if (access.viewIdentityProviders) {
        $location.url(`/realms/${realm.realm}/identity-provider-settings`);
      } else if (access.queryUsers) {
        $location.url(`/realms/${realm.realm}/users`);
      } else if (access.queryGroups) {
        $location.url(`/realms/${realm.realm}/groups`);
      } else if (access.viewEvents) {
        $location.url(`/realms/${realm.realm}/events`);
      }
    } else {
      $location.url('/realms');
    }
  });
});

module.controller(
  'RealmTabCtrl',
  (Dialog, $scope, Current, Realm, Notifications, $location) => {
    $scope.removeRealm = () => {
      Dialog.confirmDelete(Current.realm.realm, 'realm', () => {
        Realm.remove({ id: Current.realm.realm }, () => {
          Current.realms = Realm.query();
          Notifications.success('The realm has been deleted.');
          $location.url('/');
        });
      });
    };
  },
);

module.controller('ServerInfoCtrl', ($scope, ServerInfo) => {
  ServerInfo.reload();

  $scope.serverInfo = ServerInfo.get();

  $scope.$watch($scope.serverInfo, () => {
    $scope.providers = [];
    for (var spi in $scope.serverInfo.providers) {
      var p = angular.copy($scope.serverInfo.providers[spi]);
      p.name = spi;
      $scope.providers.push(p);
    }
  });

  $scope.serverInfoReload = () => {
    ServerInfo.reload();
  };
});

module.controller('RealmListCtrl', ($scope, Realm, Current) => {
  $scope.realms = Realm.query();
  Current.realms = $scope.realms;
});

module.controller(
  'RealmDropdownCtrl',
  ($scope, _Realm, Current, _Auth, $location) => {
    //    Current.realms = Realm.get();
    $scope.current = Current;

    $scope.changeRealm = (selectedRealm) => {
      $location.url(`/realms/${selectedRealm}`);
    };
  },
);

module.controller(
  'RealmCreateCtrl',
  (
    $scope,
    Current,
    Realm,
    _$upload,
    _$http,
    $location,
    $route,
    _Dialog,
    Notifications,
    Auth,
    $modal,
  ) => {
    console.log('RealmCreateCtrl');

    Current.realm = null;

    $scope.realm = {
      enabled: true,
    };

    $scope.changed = false;
    $scope.files = [];

    var oldCopy = angular.copy($scope.realm);

    $scope.importFile = ($fileContent) => {
      $scope.realm = angular.copy(JSON.parse($fileContent));
      $scope.importing = true;
    };

    $scope.viewImportDetails = () => {
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/view-object.html`,
        controller: 'ObjectModalCtrl',
        resolve: {
          object: () => $scope.realm,
        },
      });
    };

    $scope.$watch(
      'realm',
      () => {
        if (!angular.equals($scope.realm, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.$watch(
      'realm.realm',
      () => {
        $scope.realm.id = $scope.realm.realm;
      },
      true,
    );

    $scope.save = () => {
      var realmCopy = angular.copy($scope.realm);
      Realm.create(realmCopy, () => {
        Notifications.success('The realm has been created.');

        Auth.refreshPermissions(() => {
          $scope.$apply(() => {
            $location.url(`/realms/${realmCopy.realm}`);
          });
        });
      });
    };

    $scope.cancel = () => {
      $location.url('/');
    };

    $scope.reset = () => {
      $route.reload();
    };
  },
);

module.controller('ObjectModalCtrl', ($scope, object) => {
  $scope.object = object;
});

module.controller(
  'RealmDetailCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    _$http,
    $location,
    $window,
    _Dialog,
    Notifications,
    Auth,
  ) => {
    $scope.createRealm = !realm.realm;
    $scope.serverInfo = serverInfo;
    $scope.realmName = realm.realm;
    $scope.disableRename = realm.realm === masterRealm;
    $scope.authServerUrl = authServerUrl;

    if (Current.realm == null || Current.realm.realm !== realm.realm) {
      for (var i = 0; i < Current.realms.length; i++) {
        if (realm.realm === Current.realms[i].realm) {
          Current.realm = Current.realms[i];
          break;
        }
      }
    }
    for (var i = 0; i < Current.realms.length; i++) {
      if (Current.realms[i].realm === realm.realm) {
        Current.realm = Current.realms[i];
      }
    }
    $scope.realm = angular.copy(realm);

    var oldCopy = angular.copy($scope.realm);

    $scope.changed = $scope.create;

    $scope.$watch(
      'realm',
      () => {
        if (!angular.equals($scope.realm, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );
    $scope.$watch(
      'realmName',
      () => {
        if (!angular.equals($scope.realmName, oldCopy.realm)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      var realmCopy = angular.copy($scope.realm);
      realmCopy.realm = $scope.realmName;
      $scope.changed = false;
      var nameChanged = !angular.equals($scope.realmName, oldCopy.realm);
      var oldName = oldCopy.realm;
      Realm.update({ id: oldCopy.realm }, realmCopy, () => {
        var data = Realm.query(() => {
          Current.realms = data;
          for (var i = 0; i < Current.realms.length; i++) {
            if (Current.realms[i].realm === realmCopy.realm) {
              Current.realm = Current.realms[i];
              oldCopy = angular.copy($scope.realm);
            }
          }
        });

        if (nameChanged) {
          console.debug(Auth);
          console.debug(Auth.authz.tokenParsed.iss);

          if (Auth.authz.tokenParsed.iss.endsWith(masterRealm)) {
            Auth.refreshPermissions(() => {
              Auth.refreshPermissions(() => {
                Notifications.success(
                  'Your changes have been saved to the realm.',
                );
                $scope.$apply(() => {
                  $location.url(`/realms/${realmCopy.realm}`);
                });
              });
            });
          } else {
            delete Auth.authz.token;
            delete Auth.authz.refreshToken;

            var newLocation = $window.location.href
              .replace(`/${oldName}/`, `/${realmCopy.realm}/`)
              .replace(`/realms/${oldName}`, `/realms/${realmCopy.realm}`);
            window.location.replace(newLocation);
          }
        } else {
          $location.url(`/realms/${realmCopy.realm}`);
          Notifications.success('Your changes have been saved to the realm.');
        }
      });
    };

    $scope.reset = () => {
      $scope.realm = angular.copy(oldCopy);
      $scope.changed = false;
    };

    $scope.cancel = () => {
      window.history.back();
    };
  },
);

function genericRealmUpdate(
  $scope,
  _Current,
  Realm,
  realm,
  serverInfo,
  _$http,
  $route,
  _Dialog,
  Notifications,
  _url,
) {
  $scope.realm = angular.copy(realm);
  $scope.serverInfo = serverInfo;
  $scope.registrationAllowed = $scope.realm.registrationAllowed;

  var oldCopy = angular.copy($scope.realm);

  $scope.changed = false;

  $scope.$watch(
    'realm',
    () => {
      if (!angular.equals($scope.realm, oldCopy)) {
        $scope.changed = true;
      }
    },
    true,
  );

  $scope.save = () => {
    var realmCopy = angular.copy($scope.realm);
    console.log('updating realm...');
    $scope.changed = false;
    console.log(`oldCopy.realm - ${oldCopy.realm}`);
    Realm.update({ id: oldCopy.realm }, realmCopy, () => {
      $route.reload();
      Notifications.success('Your changes have been saved to the realm.');
      $scope.registrationAllowed = $scope.realm.registrationAllowed;
    });
  };

  $scope.reset = () => {
    $scope.realm = angular.copy(oldCopy);
    $scope.changed = false;
  };

  $scope.cancel = () => {
    $route.reload();
  };
}

module.controller(
  'DefenseHeadersCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    Dialog,
    Notifications,
  ) => {
    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/defense/headers`,
    );
  },
);

module.controller(
  'RealmLoginSettingsCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    Dialog,
    Notifications,
  ) => {
    // KEYCLOAK-5474: Make sure duplicateEmailsAllowed is disabled if loginWithEmailAllowed
    $scope.$watch('realm.loginWithEmailAllowed', () => {
      if ($scope.realm.loginWithEmailAllowed) {
        $scope.realm.duplicateEmailsAllowed = false;
      }
    });

    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/login-settings`,
    );
  },
);

module.controller(
  'RealmOtpPolicyCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    Dialog,
    Notifications,
  ) => {
    $scope.optionsDigits = [6, 8];

    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/authentication/otp-policy`,
    );
  },
);

module.controller(
  'RealmWebAuthnPolicyCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    $location,
    Dialog,
    Notifications,
  ) => {
    $scope.deleteAcceptableAaguid = (index) => {
      $scope.realm.webAuthnPolicyAcceptableAaguids.splice(index, 1);
    };

    $scope.addAcceptableAaguid = () => {
      $scope.realm.webAuthnPolicyAcceptableAaguids.push(
        $scope.newAcceptableAaguid,
      );
      $scope.newAcceptableAaguid = '';
    };

    // Just for case the user fill particular URL with disabled WebAuthn feature.
    $scope.redirectIfWebAuthnDisabled = () => {
      if (!serverInfo.featureEnabled('WEB_AUTHN')) {
        $location.url(`/realms/${$scope.realm.realm}/authentication`);
      }
    };

    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/authentication/webauthn-policy`,
    );
  },
);

module.controller(
  'RealmWebAuthnPasswordlessPolicyCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    $location,
    Dialog,
    Notifications,
  ) => {
    $scope.deleteAcceptableAaguid = (index) => {
      $scope.realm.webAuthnPolicyPasswordlessAcceptableAaguids.splice(index, 1);
    };

    $scope.addAcceptableAaguid = () => {
      $scope.realm.webAuthnPolicyPasswordlessAcceptableAaguids.push(
        $scope.newAcceptableAaguid,
      );
      $scope.newAcceptableAaguid = '';
    };

    // Just for case the user fill particular URL with disabled WebAuthn feature.
    $scope.redirectIfWebAuthnDisabled = () => {
      if (!serverInfo.featureEnabled('WEB_AUTHN')) {
        $location.url(`/realms/${$scope.realm.realm}/authentication`);
      }
    };

    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/authentication/webauthn-policy-passwordless`,
    );
  },
);

module.controller(
  'RealmCibaPolicyCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    _$location,
    Dialog,
    Notifications,
  ) => {
    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/authentication/ciba-policy`,
    );
  },
);

module.controller(
  'RealmThemeCtrl',
  (
    $scope,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    Dialog,
    Notifications,
  ) => {
    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/theme-settings`,
    );

    $scope.supportedLocalesOptions = {
      multiple: true,
      simple_tags: true,
      tags: [],
    };

    updateSupported();

    function localeForTheme(type, name) {
      name = name || 'base';
      for (var i = 0; i < serverInfo.themes[type].length; i++) {
        if (serverInfo.themes[type][i].name === name) {
          return serverInfo.themes[type][i].locales || [];
        }
      }
      return [];
    }

    function updateSupported() {
      if ($scope.realm.internationalizationEnabled) {
        var accountLocales = localeForTheme(
          'account',
          $scope.realm.accountTheme,
        );
        var loginLocales = localeForTheme('login', $scope.realm.loginTheme);
        var emailLocales = localeForTheme('email', $scope.realm.emailTheme);

        var supportedLocales = [];
        for (var i = 0; i < accountLocales.length; i++) {
          var l = accountLocales[i];
          if (loginLocales.indexOf(l) >= 0 && emailLocales.indexOf(l) >= 0) {
            supportedLocales.push(l);
          }
        }

        $scope.supportedLocalesOptions.tags = supportedLocales;

        if (!$scope.realm.supportedLocales) {
          $scope.realm.supportedLocales = supportedLocales;
        } else {
          for (var i = 0; i < $scope.realm.supportedLocales.length; i++) {
            if (
              supportedLocales.indexOf($scope.realm.supportedLocales[i]) === -1
            ) {
              $scope.realm.supportedLocales = supportedLocales;
            }
          }
        }

        if (
          !$scope.realm.defaultLocale ||
          supportedLocales.indexOf($scope.realm.defaultLocale) === -1
        ) {
          $scope.realm.defaultLocale = 'en';
        }
      }
    }

    $scope.$watch('realm.loginTheme', updateSupported);
    $scope.$watch('realm.accountTheme', updateSupported);
    $scope.$watch('realm.emailTheme', updateSupported);
    $scope.$watch('realm.internationalizationEnabled', updateSupported);
  },
);

module.controller(
  'RealmLocalizationCtrl',
  (
    $scope,
    _Current,
    $location,
    _Realm,
    realm,
    _serverInfo,
    Notifications,
    RealmSpecificLocales,
    realmSpecificLocales,
    RealmSpecificLocalizationTexts,
    RealmSpecificLocalizationText,
    Dialog,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.realmSpecificLocales = realmSpecificLocales;
    $scope.newLocale = null;
    $scope.selectedRealmSpecificLocales = null;
    $scope.localizationTexts = null;

    $scope.createLocale = () => {
      if (!$scope.newLocale) {
        Notifications.error($translate.instant('missing-locale'));
        return;
      }
      $scope.realmSpecificLocales.push($scope.newLocale);
      $scope.selectedRealmSpecificLocales = $scope.newLocale;
      $scope.newLocale = null;
      $location.url(
        `/create/localization/${realm.realm}/${$scope.selectedRealmSpecificLocales}`,
      );
    };

    $scope.$watch(
      () => $scope.selectedRealmSpecificLocales,
      () => {
        if ($scope.selectedRealmSpecificLocales != null) {
          $scope.updateRealmSpecificLocalizationTexts();
        }
      },
    );

    $scope.updateRealmSpecificLocales = () => {
      RealmSpecificLocales.get({ id: realm.realm }, (updated) => {
        $scope.realmSpecificLocales = updated;
      });
    };

    $scope.updateRealmSpecificLocalizationTexts = () => {
      RealmSpecificLocalizationTexts.get(
        { id: realm.realm, locale: $scope.selectedRealmSpecificLocales },
        (updated) => {
          $scope.localizationTexts = updated;
        },
      );
    };

    $scope.removeLocalizationText = (key) => {
      Dialog.confirmDelete(key, 'localization text', () => {
        RealmSpecificLocalizationText.remove(
          {
            realm: realm.realm,
            locale: $scope.selectedRealmSpecificLocales,
            key: key,
          },
          () => {
            $scope.updateRealmSpecificLocalizationTexts();
            Notifications.success(
              $translate.instant('localization-text.remove.success'),
            );
          },
        );
      });
    };
  },
);

module.controller(
  'RealmLocalizationUploadCtrl',
  (
    $scope,
    _Current,
    _Realm,
    realm,
    _serverInfo,
    _$http,
    _$route,
    _Dialog,
    Notifications,
    $upload,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.locale = null;
    $scope.files = [];

    $scope.onFileSelect = ($files) => {
      $scope.files = $files;
    };

    $scope.reset = () => {
      $scope.locale = null;
      $scope.files = null;
    };

    $scope.save = () => {
      if (!$scope.files || $scope.files.length === 0) {
        Notifications.error($translate.instant('missing-file'));
        return;
      }
      //$files: an array of files selected, each file has name, size, and type.
      for (var i = 0; i < $scope.files.length; i++) {
        var $file = $scope.files[i];
        $scope.upload = $upload
          .upload({
            url: `${authUrl}/admin/realms/${realm.realm}/localization/${$scope.locale}`,
            file: $file,
          })
          .then((_response) => {
            $scope.reset();
            Notifications.success(
              $translate.instant('localization-file.upload.success'),
            );
          })
          .catch(() => {
            Notifications.error(
              $translate.instant('localization-file.upload.error'),
            );
          });
      }
    };
  },
);

module.controller(
  'RealmLocalizationDetailCtrl',
  (
    $scope,
    _Current,
    $location,
    _Realm,
    realm,
    Notifications,
    locale,
    key,
    RealmSpecificLocalizationText,
    localizationText,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.locale = locale;
    $scope.key = key;
    $scope.value = localizationText ? localizationText.content : null;

    $scope.create = !key;

    $scope.save = () => {
      if ($scope.create) {
        RealmSpecificLocalizationText.save(
          {
            realm: realm.realm,
            locale: $scope.locale,
            key: $scope.key,
          },
          $scope.value,
          (_data, _headers) => {
            $location.url(`/realms/${realm.realm}/localization`);
            Notifications.success(
              $translate.instant('localization-text.create.success'),
            );
          },
        );
      } else {
        RealmSpecificLocalizationText.save(
          {
            realm: realm.realm,
            locale: $scope.locale,
            key: $scope.key,
          },
          $scope.value,
          (_data, _headers) => {
            $location.url(`/realms/${realm.realm}/localization`);
            Notifications.success(
              $translate.instant('localization-text.update.success'),
            );
          },
        );
      }
    };

    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/localization`);
    };
  },
);

module.controller(
  'RealmCacheCtrl',
  (
    $scope,
    realm,
    RealmClearUserCache,
    RealmClearRealmCache,
    RealmClearKeysCache,
    Notifications,
  ) => {
    $scope.realm = angular.copy(realm);

    $scope.clearUserCache = () => {
      RealmClearUserCache.save({ realm: realm.realm }, () => {
        Notifications.success('User cache cleared');
      });
    };

    $scope.clearRealmCache = () => {
      RealmClearRealmCache.save({ realm: realm.realm }, () => {
        Notifications.success('Realm cache cleared');
      });
    };

    $scope.clearKeysCache = () => {
      RealmClearKeysCache.save({ realm: realm.realm }, () => {
        Notifications.success('Public keys cache cleared');
      });
    };
  },
);

module.controller(
  'RealmPasswordPolicyCtrl',
  (
    $scope,
    Realm,
    realm,
    _$http,
    _$location,
    $route,
    _Dialog,
    Notifications,
    serverInfo,
  ) => {
    var parse = (policyString) => {
      var policies = [];
      if (!policyString || policyString.length === 0) {
        return policies;
      }

      var policyArray = policyString.split(' and ');

      for (var i = 0; i < policyArray.length; i++) {
        var policyToken = policyArray[i];
        var id;
        var value;
        if (policyToken.indexOf('(') === -1) {
          id = policyToken.trim();
          value = null;
        } else {
          id = policyToken.substring(0, policyToken.indexOf('('));
          value = policyToken
            .substring(
              policyToken.indexOf('(') + 1,
              policyToken.lastIndexOf(')'),
            )
            .trim();
        }

        for (var j = 0; j < serverInfo.passwordPolicies.length; j++) {
          if (serverInfo.passwordPolicies[j].id === id) {
            // clone
            var p = JSON.parse(JSON.stringify(serverInfo.passwordPolicies[j]));

            p.value = (value && value) || p.defaultValue;
            policies.push(p);
          }
        }
      }
      return policies;
    };

    var toString = (policies) => {
      if (!policies || policies.length === 0) {
        return '';
      }
      var policyString = '';
      for (var i = 0; i < policies.length; i++) {
        policyString += `${policies[i].id}(${policies[i].value})`;
        if (i !== policies.length - 1) {
          policyString += ' and ';
        }
      }
      return policyString;
    };

    $scope.realm = realm;
    $scope.serverInfo = serverInfo;

    $scope.changed = false;
    console.log(JSON.stringify(parse(realm.passwordPolicy)));
    $scope.policy = parse(realm.passwordPolicy);
    var oldCopy = angular.copy($scope.policy);

    $scope.$watch(
      'policy',
      () => {
        $scope.changed = !angular.equals($scope.policy, oldCopy);
      },
      true,
    );

    $scope.addPolicy = (policy) => {
      policy.value = policy.defaultValue;
      if (!$scope.policy) {
        $scope.policy = [];
      }
      $scope.policy.push(policy);
    };

    $scope.removePolicy = (index) => {
      $scope.policy.splice(index, 1);
    };

    $scope.save = () => {
      $scope.realm.passwordPolicy = toString($scope.policy);
      console.log($scope.realm.passwordPolicy);

      Realm.update($scope.realm, () => {
        $route.reload();
        Notifications.success('Your changes have been saved to the realm.');
      });
    };

    $scope.reset = () => {
      $route.reload();
    };
  },
);

module.controller(
  'RealmDefaultRolesCtrl',
  (
    $scope,
    $route,
    realm,
    roles,
    Notifications,
    ClientRole,
    Client,
    RoleRealmComposites,
    RoleClientComposites,
    ComponentUtils,
    $http,
  ) => {
    console.log('RealmDefaultRolesCtrl');

    $scope.realm = realm;
    $scope.availableRealmRoles = angular.copy(roles);
    $scope.selectedRealmRoles = [];
    $scope.selectedRealmDefRoles = [];

    $scope.availableClientRoles = [];
    $scope.selectedClientRoles = [];
    $scope.selectedClientDefRoles = [];

    for (var j = 0; j < $scope.availableRealmRoles.length; j++) {
      if ($scope.availableRealmRoles[j].id === realm.defaultRole.id) {
        var realmRole = $scope.availableRealmRoles[j];
        var idx = $scope.availableRealmRoles.indexOf(realmRole);
        $scope.availableRealmRoles.splice(idx, 1);
        break;
      }
    }

    $scope.realmMappings = RoleRealmComposites.query(
      { realm: realm.realm, role: realm.defaultRole.id },
      () => {
        for (var i = 0; i < $scope.realmMappings.length; i++) {
          var role = $scope.realmMappings[i];
          for (var j = 0; j < $scope.availableRealmRoles.length; j++) {
            var realmRole = $scope.availableRealmRoles[j];
            if (realmRole.id === role.id) {
              var idx = $scope.availableRealmRoles.indexOf(realmRole);
              if (idx !== -1) {
                $scope.availableRealmRoles.splice(idx, 1);
                break;
              }
            }
          }
        }
      },
    );

    $scope.addRealmDefaultRole = () => {
      $scope.selectedRealmRolesToAdd = JSON.parse(
        `[${$scope.selectedRealmRoles}]`,
      );
      $http
        .post(
          `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${realm.defaultRole.id}/composites`,
          $scope.selectedRealmRolesToAdd,
        )
        .then(() => {
          // Remove selected roles from the Available roles and add them to realm default roles (move from left to right).
          for (var i = 0; i < $scope.selectedRealmRolesToAdd.length; i++) {
            var selectedRole = $scope.selectedRealmRolesToAdd[i];
            var index = ComponentUtils.findIndexById(
              $scope.availableRealmRoles,
              selectedRole.id,
            );
            if (index > -1) {
              $scope.availableRealmRoles.splice(index, 1);
              $scope.realmMappings.push(selectedRole);
            }
          }

          $scope.selectedRealmRoles = [];
          $scope.selectedRealmRolesToAdd = [];
          Notifications.success('Default roles updated.');
        });
    };

    $scope.deleteRealmDefaultRole = () => {
      $scope.selectedClientRolesToRemove = JSON.parse(
        `[${$scope.selectedRealmDefRoles}]`,
      );
      $http
        .delete(
          `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${realm.defaultRole.id}/composites`,
          {
            data: $scope.selectedClientRolesToRemove,
            headers: { 'content-type': 'application/json' },
          },
        )
        .then(() => {
          // Remove selected roles from the realm default roles and add them to available roles (move from right to left).
          for (var i = 0; i < $scope.selectedClientRolesToRemove.length; i++) {
            var selectedRole = $scope.selectedClientRolesToRemove[i];
            var index = ComponentUtils.findIndexById(
              $scope.realmMappings,
              selectedRole.id,
            );
            if (index > -1) {
              $scope.realmMappings.splice(index, 1);
              $scope.availableRealmRoles.push(selectedRole);
            }
          }

          $scope.selectedRealmDefRoles = [];
          $scope.selectedClientRolesToRemove = [];
          Notifications.success('Default roles updated.');
        });
    };

    $scope.changeClient = (client) => {
      if (!client?.id) {
        $scope.selectedClient = null;
        return;
      }
      $scope.selectedClient = client;
      $scope.selectedClientRoles = [];
      $scope.selectedClientDefRoles = [];

      // Populate available roles for selected client
      if ($scope.selectedClient) {
        $scope.availableClientRoles = ClientRole.query(
          { realm: realm.realm, client: client.id },
          () => {
            $scope.clientMappings = RoleClientComposites.query(
              {
                realm: realm.realm,
                role: realm.defaultRole.id,
                client: client.id,
              },
              () => {
                for (var i = 0; i < $scope.clientMappings.length; i++) {
                  var role = $scope.clientMappings[i];
                  for (var j = 0; j < $scope.availableClientRoles.length; j++) {
                    var clientRole = $scope.availableClientRoles[j];
                    if (clientRole.id === role.id) {
                      var idx = $scope.availableClientRoles.indexOf(clientRole);
                      if (idx !== -1) {
                        $scope.availableClientRoles.splice(idx, 1);
                        break;
                      }
                    }
                  }
                }
              },
            );
            for (var j = 0; j < $scope.availableClientRoles.length; j++) {
              if ($scope.availableClientRoles[j] === realm.defaultRole.id) {
                var clientRole = $scope.availableClientRoles[j];
                var idx = $scope.availableClientRoles.indexof(clientRole);
                $scope.availableClientRoles.splice(idx, 1);
                break;
              }
            }
          },
        );
      } else {
        $scope.availableClientRoles = null;
      }
    };

    $scope.addClientDefaultRole = () => {
      $scope.selectedClientRolesToAdd = JSON.parse(
        `[${$scope.selectedClientRoles}]`,
      );
      $http
        .post(
          `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${realm.defaultRole.id}/composites`,
          $scope.selectedClientRolesToAdd,
        )
        .then(() => {
          // Remove selected roles from the app available roles and add them to app default roles (move from left to right).
          for (var i = 0; i < $scope.selectedClientRolesToAdd.length; i++) {
            var selectedRole = $scope.selectedClientRolesToAdd[i];

            var index = ComponentUtils.findIndexById(
              $scope.availableClientRoles,
              selectedRole.id,
            );
            if (index > -1) {
              $scope.availableClientRoles.splice(index, 1);
              $scope.clientMappings.push(selectedRole);
            }
          }

          $scope.selectedClientRoles = [];
          $scope.selectedClientRolesToAdd = [];
          Notifications.success('Default roles updated.');
        });
    };

    $scope.rmClientDefaultRole = () => {
      $scope.selectedClientRolesToRemove = JSON.parse(
        `[${$scope.selectedClientDefRoles}]`,
      );
      $http
        .delete(
          `${authUrl}/admin/realms/${realm.realm}/roles-by-id/${realm.defaultRole.id}/composites`,
          {
            data: $scope.selectedClientRolesToRemove,
            headers: { 'content-type': 'application/json' },
          },
        )
        .then(() => {
          // Remove selected roles from the realm default roles and add them to available roles (move from right to left).
          for (var i = 0; i < $scope.selectedClientRolesToRemove.length; i++) {
            var selectedRole = $scope.selectedClientRolesToRemove[i];
            var index = ComponentUtils.findIndexById(
              $scope.clientMappings,
              selectedRole.id,
            );
            if (index > -1) {
              $scope.clientMappings.splice(index, 1);
              $scope.availableClientRoles.push(selectedRole);
            }
          }

          $scope.selectedClientDefRoles = [];
          $scope.selectedClientRolesToRemove = [];
          Notifications.success('Default roles updated.');
        });
    };

    clientSelectControl($scope, $route.current.params.realm, Client);
  },
);

module.controller(
  'IdentityProviderTabCtrl',
  (Dialog, $scope, Current, Notifications, $location) => {
    $scope.removeIdentityProvider = () => {
      Dialog.confirmDelete($scope.identityProvider.alias, 'provider', () => {
        $scope.identityProvider.$remove(
          {
            realm: Current.realm.realm,
            alias: $scope.identityProvider.alias,
          },
          () => {
            $location.url(
              `/realms/${Current.realm.realm}/identity-provider-settings`,
            );
            Notifications.success('The identity provider has been deleted.');
          },
        );
      });
    };
  },
);

module.controller(
  'RealmIdentityProviderCtrl',
  (
    $scope,
    _$filter,
    $upload,
    $http,
    $route,
    realm,
    instance,
    providerFactory,
    IdentityProvider,
    serverInfo,
    authFlows,
    $location,
    Notifications,
    Dialog,
  ) => {
    $scope.realm = angular.copy(realm);

    $scope.initSamlProvider = () => {
      $scope.nameIdFormats = [
        {
          format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
          name: 'Persistent',
        },
        {
          format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
          name: 'Transient',
        },
        {
          format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          name: 'Email',
        },
        {
          format: 'urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos',
          name: 'Kerberos',
        },
        {
          format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName',
          name: 'X.509 Subject Name',
        },
        {
          format:
            'urn:oasis:names:tc:SAML:1.1:nameid-format:WindowsDomainQualifiedName',
          name: 'Windows Domain Qualified Name',
        },
        {
          format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
          name: 'Unspecified',
        },
      ];
      $scope.signatureAlgorithms = [
        'RSA_SHA1',
        'RSA_SHA256',
        'RSA_SHA256_MGF1',
        'RSA_SHA512',
        'RSA_SHA512_MGF1',
        'DSA_SHA1',
      ];
      $scope.xmlKeyNameTranformers = ['NONE', 'KEY_ID', 'CERT_SUBJECT'];
      $scope.principalTypes = [
        {
          type: 'SUBJECT',
          name: 'Subject NameID',
        },
        {
          type: 'ATTRIBUTE',
          name: 'Attribute [Name]',
        },
        {
          type: 'FRIENDLY_ATTRIBUTE',
          name: 'Attribute [Friendly Name]',
        },
      ];
      if (instance?.alias) {
      } else {
        $scope.identityProvider.config.nameIDPolicyFormat =
          $scope.nameIdFormats[0].format;
        $scope.identityProvider.config.principalType =
          $scope.principalTypes[0].type;
        $scope.identityProvider.config.signatureAlgorithm =
          $scope.signatureAlgorithms[1];
        $scope.identityProvider.config.xmlSigKeyInfoKeyNameTransformer =
          $scope.xmlKeyNameTranformers[1];
        $scope.identityProvider.config.allowCreate = 'true';
      }
      $scope.identityProvider.config.entityId =
        $scope.identityProvider.config.entityId ||
        `${authUrl}/realms/${realm.realm}`;
    };

    $scope.hidePassword = true;
    $scope.fromUrl = {
      data: '',
    };

    if (instance?.alias) {
      $scope.identityProvider = angular.copy(instance);
      $scope.newIdentityProvider = false;
      for (var i in serverInfo.identityProviders) {
        var provider = serverInfo.identityProviders[i];

        if (provider.id === instance.providerId) {
          $scope.provider = provider;
        }
      }
    } else {
      $scope.identityProvider = {};
      $scope.identityProvider.config = {};
      $scope.identityProvider.alias = providerFactory.id;
      $scope.identityProvider.providerId = providerFactory.id;

      $scope.identityProvider.enabled = true;
      $scope.identityProvider.authenticateByDefault = false;
      $scope.identityProvider.firstBrokerLoginFlowAlias = 'first broker login';
      $scope.identityProvider.config.useJwksUrl = 'true';
      $scope.identityProvider.config.syncMode = 'IMPORT';
      $scope.newIdentityProvider = true;
    }

    $scope.changed = $scope.newIdentityProvider;

    $scope.$watch(
      'identityProvider',
      () => {
        if (!angular.equals($scope.identityProvider, instance)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.serverInfo = serverInfo;

    $scope.allProviders = angular.copy(serverInfo.identityProviders);

    $scope.configuredProviders = angular.copy(realm.identityProviders);

    removeUsedSocial();

    $scope.authFlows = [];
    for (var i = 0; i < authFlows.length; i++) {
      if (authFlows[i].providerId === 'basic-flow') {
        $scope.authFlows.push(authFlows[i]);
      }
    }

    $scope.postBrokerAuthFlows = [];
    var emptyFlow = { alias: '' };
    $scope.postBrokerAuthFlows.push(emptyFlow);
    for (var i = 0; i < $scope.authFlows.length; i++) {
      $scope.postBrokerAuthFlows.push($scope.authFlows[i]);
    }

    if (!$scope.identityProvider.postBrokerLoginFlowAlias) {
      $scope.identityProvider.postBrokerLoginFlowAlias =
        $scope.postBrokerAuthFlows[0].alias;
    }

    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.files = [];
    $scope.importFile = false;
    $scope.importUrl = false;

    $scope.onFileSelect = ($files) => {
      $scope.importFile = true;
      $scope.files = $files;
    };

    $scope.clearFileSelect = () => {
      $scope.importUrl = false;
      $scope.importFile = false;
      $scope.files = null;
    };

    var setConfig = (data) => {
      if (data['enabledFromMetadata'] !== undefined) {
        $scope.identityProvider.enabled =
          data['enabledFromMetadata'] === 'true';
        delete data['enabledFromMetadata'];
      }
      for (var key in data) {
        $scope.identityProvider.config[key] = data[key];
      }
    };

    $scope.uploadFile = () => {
      if (!$scope.identityProvider.alias) {
        Notifications.error('You must specify an alias');
        return;
      }
      var input = {
        providerId: providerFactory.id,
      };
      //$files: an array of files selected, each file has name, size, and type.
      for (var i = 0; i < $scope.files.length; i++) {
        var $file = $scope.files[i];
        $scope.upload = $upload
          .upload({
            url: `${authUrl}/admin/realms/${realm.realm}/identity-provider/import-config`,
            // method: POST or PUT,
            // headers: {'headerKey': 'headerValue'}, withCredential: true,
            data: input,
            file: $file,
            /* set file formData name for 'Content-Desposition' header. Default: 'file' */
            //fileFormDataName: myFile,
            /* customize how data is added to formData. See #40#issuecomment-28612000 for example */
            //formDataAppender: function(formData, key, val){}
          })
          .progress((evt) => {
            console.log(
              `percent: ${parseInt((100.0 * evt.loaded) / evt.total, 10)}`,
            );
          })
          .then((response) => {
            setConfig(response.data);
            $scope.clearFileSelect();
            Notifications.success(
              'The IDP metadata has been loaded from file.',
            );
          })
          .catch(() => {
            Notifications.error(
              'The file can not be uploaded. Please verify the file.',
            );
          });
      }
    };

    $scope.importFrom = () => {
      if (!$scope.identityProvider.alias) {
        Notifications.error('You must specify an alias');
        return;
      }
      var input = {
        fromUrl: $scope.fromUrl.data,
        providerId: providerFactory.id,
      };
      $http
        .post(
          `${authUrl}/admin/realms/${realm.realm}/identity-provider/import-config`,
          input,
        )
        .then((response) => {
          setConfig(response.data);
          $scope.fromUrl.data = '';
          $scope.importUrl = false;
          Notifications.success('Imported config information from url.');
        })
        .catch(() => {
          Notifications.error(
            'Config can not be imported. Please verify the url.',
          );
        });
    };
    $scope.$watch('fromUrl.data', (_newVal, _oldVal) => {
      if ($scope.fromUrl.data && $scope.fromUrl.data.length > 0) {
        $scope.importUrl = true;
      } else {
        $scope.importUrl = false;
      }
    });

    $scope.$watch(
      'configuredProviders',
      (configuredProviders) => {
        if (configuredProviders) {
          $scope.configuredProviders = angular.copy(configuredProviders);

          for (var j = 0; j < configuredProviders.length; j++) {
            var configProvidedId = configuredProviders[j].providerId;

            for (var i in $scope.allProviders) {
              var provider = $scope.allProviders[i];
              if (provider.id === configProvidedId) {
                configuredProviders[j].provider = provider;
              }
            }
          }
          $scope.configuredProviders = angular.copy(configuredProviders);
        }
      },
      true,
    );

    $scope.callbackUrl = `${authServerUrl}/realms/${realm.realm}/broker/`;

    $scope.addProvider = (provider) => {
      $location.url(`/create/identity-provider/${realm.realm}/${provider.id}`);
    };

    $scope.save = () => {
      if ($scope.newIdentityProvider) {
        if (!$scope.identityProvider.alias) {
          Notifications.error('You must specify an alias');
          return;
        }
        IdentityProvider.save(
          {
            realm: $scope.realm.realm,
            alias: '',
          },
          $scope.identityProvider,
          () => {
            $location.url(
              `/realms/${realm.realm}/identity-provider-settings/provider/${$scope.identityProvider.providerId}/${$scope.identityProvider.alias}`,
            );
            Notifications.success(
              `The ${$scope.identityProvider.alias} provider has been created.`,
            );
          },
        );
      } else {
        IdentityProvider.update(
          {
            realm: $scope.realm.realm,
            alias: $scope.identityProvider.alias,
          },
          $scope.identityProvider,
          () => {
            $route.reload();
            Notifications.success(
              `The ${$scope.identityProvider.alias} provider has been updated.`,
            );
          },
        );
      }
    };

    $scope.cancel = () => {
      if ($scope.newIdentityProvider) {
        $location.url(`/realms/${realm.realm}/identity-provider-settings`);
      } else {
        $route.reload();
      }
    };

    $scope.reset = () => {
      $scope.identityProvider = {};
      $scope.configuredProviders = angular.copy($scope.realm.identityProviders);
    };

    $scope.showPassword = (flag) => {
      $scope.hidePassword = flag;
    };

    $scope.removeIdentityProvider = (identityProvider) => {
      Dialog.confirmDelete(identityProvider.alias, 'provider', () => {
        IdentityProvider.remove(
          {
            realm: realm.realm,
            alias: identityProvider.alias,
          },
          () => {
            $route.reload();
            Notifications.success('The identity provider has been deleted.');
          },
        );
      });
    };

    // KEYCLOAK-5932: remove social providers that have already been defined
    function removeUsedSocial() {
      var i = $scope.allProviders.length;
      while (i--) {
        if ($scope.allProviders[i].groupName !== 'Social') continue;
        if ($scope.configuredProviders != null) {
          for (var j = 0; j < $scope.configuredProviders.length; j++) {
            if (
              $scope.configuredProviders[j].providerId ===
              $scope.allProviders[i].id
            ) {
              $scope.allProviders.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    if (instance?.alias) {
      try {
        $scope.authnContextClassRefs = JSON.parse(
          $scope.identityProvider.config.authnContextClassRefs || '[]',
        );
      } catch (_e) {
        $scope.authnContextClassRefs = [];
      }
      try {
        $scope.authnContextDeclRefs = JSON.parse(
          $scope.identityProvider.config.authnContextDeclRefs || '[]',
        );
      } catch (_e) {
        $scope.authnContextDeclRefs = [];
      }
    } else {
      $scope.authnContextClassRefs = [];
      $scope.authnContextDeclRefs = [];
    }

    $scope.deleteAuthnContextClassRef = (index) => {
      $scope.authnContextClassRefs.splice(index, 1);
      $scope.identityProvider.config.authnContextClassRefs = JSON.stringify(
        $scope.authnContextClassRefs,
      );
    };

    $scope.addAuthnContextClassRef = () => {
      $scope.authnContextClassRefs.push($scope.newAuthnContextClassRef);
      $scope.identityProvider.config.authnContextClassRefs = JSON.stringify(
        $scope.authnContextClassRefs,
      );
      $scope.newAuthnContextClassRef = '';
    };

    $scope.deleteAuthnContextDeclRef = (index) => {
      $scope.authnContextDeclRefs.splice(index, 1);
      $scope.identityProvider.config.authnContextDeclRefs = JSON.stringify(
        $scope.authnContextDeclRefs,
      );
    };

    $scope.addAuthnContextDeclRef = () => {
      $scope.authnContextDeclRefs.push($scope.newAuthnContextDeclRef);
      $scope.identityProvider.config.authnContextDeclRefs = JSON.stringify(
        $scope.authnContextDeclRefs,
      );
      $scope.newAuthnContextDeclRef = '';
    };
  },
);

module.controller(
  'RealmTokenDetailCtrl',
  (
    $scope,
    Realm,
    realm,
    _$http,
    _$location,
    $route,
    _Dialog,
    Notifications,
    _TimeUnit,
    TimeUnit2,
    serverInfo,
  ) => {
    $scope.realm = realm;
    $scope.serverInfo = serverInfo;
    $scope.actionTokenProviders =
      $scope.serverInfo.providers.actionTokenHandler.providers;

    $scope.realm.accessTokenLifespan = TimeUnit2.asUnit(
      realm.accessTokenLifespan,
    );
    $scope.realm.accessTokenLifespanForImplicitFlow = TimeUnit2.asUnit(
      realm.accessTokenLifespanForImplicitFlow,
    );
    $scope.realm.ssoSessionIdleTimeout = TimeUnit2.asUnit(
      realm.ssoSessionIdleTimeout,
    );
    $scope.realm.ssoSessionMaxLifespan = TimeUnit2.asUnit(
      realm.ssoSessionMaxLifespan,
    );
    $scope.realm.ssoSessionIdleTimeoutRememberMe = TimeUnit2.asUnit(
      realm.ssoSessionIdleTimeoutRememberMe,
    );
    $scope.realm.ssoSessionMaxLifespanRememberMe = TimeUnit2.asUnit(
      realm.ssoSessionMaxLifespanRememberMe,
    );
    $scope.realm.offlineSessionIdleTimeout = TimeUnit2.asUnit(
      realm.offlineSessionIdleTimeout,
    );
    // KEYCLOAK-7688 Offline Session Max for Offline Token
    $scope.realm.offlineSessionMaxLifespan = TimeUnit2.asUnit(
      realm.offlineSessionMaxLifespan,
    );
    $scope.realm.clientSessionIdleTimeout = TimeUnit2.asUnit(
      realm.clientSessionIdleTimeout,
    );
    $scope.realm.clientSessionMaxLifespan = TimeUnit2.asUnit(
      realm.clientSessionMaxLifespan,
    );
    $scope.realm.clientOfflineSessionIdleTimeout = TimeUnit2.asUnit(
      realm.clientOfflineSessionIdleTimeout,
    );
    $scope.realm.clientOfflineSessionMaxLifespan = TimeUnit2.asUnit(
      realm.clientOfflineSessionMaxLifespan,
    );
    $scope.realm.accessCodeLifespan = TimeUnit2.asUnit(
      realm.accessCodeLifespan,
    );
    $scope.realm.accessCodeLifespanLogin = TimeUnit2.asUnit(
      realm.accessCodeLifespanLogin,
    );
    $scope.realm.accessCodeLifespanUserAction = TimeUnit2.asUnit(
      realm.accessCodeLifespanUserAction,
    );
    $scope.realm.actionTokenGeneratedByAdminLifespan = TimeUnit2.asUnit(
      realm.actionTokenGeneratedByAdminLifespan,
    );
    $scope.realm.actionTokenGeneratedByUserLifespan = TimeUnit2.asUnit(
      realm.actionTokenGeneratedByUserLifespan,
    );
    $scope.realm.oauth2DeviceCodeLifespan = TimeUnit2.asUnit(
      realm.oauth2DeviceCodeLifespan,
    );
    $scope.realm.attributes = realm.attributes;

    var oldCopy = angular.copy($scope.realm);
    $scope.changed = false;

    $scope.$watch(
      'realm',
      () => {
        if (!angular.equals($scope.realm, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.$watch(
      'actionLifespanId',
      () => {
        // changedActionLifespanId signals other watchers that we were merely
        // changing the dropdown and we should not enable 'save' button
        if ($scope.actionTokenAttribute?.hasOwnProperty('time')) {
          $scope.changedActionLifespanId = true;
        }

        $scope.actionTokenAttribute = TimeUnit2.asUnit(
          $scope.realm.attributes[
            `actionTokenGeneratedByUserLifespan.${$scope.actionLifespanId}`
          ],
        );
      },
      true,
    );

    $scope.$watch(
      'actionTokenAttribute',
      () => {
        if ($scope.actionLifespanId === null) return;

        if ($scope.changedActionLifespanId) {
          $scope.changedActionLifespanId = false;
          return;
        } else {
          $scope.changed = true;
        }

        if ($scope.actionTokenAttribute !== null) {
          $scope.realm.attributes[
            `actionTokenGeneratedByUserLifespan.${$scope.actionLifespanId}`
          ] = $scope.actionTokenAttribute.toSeconds();
        }
      },
      true,
    );

    $scope.changeRevokeRefreshToken = () => {};

    $scope.save = () => {
      $scope.realm.accessTokenLifespan =
        $scope.realm.accessTokenLifespan.toSeconds();
      $scope.realm.accessTokenLifespanForImplicitFlow =
        $scope.realm.accessTokenLifespanForImplicitFlow.toSeconds();
      $scope.realm.ssoSessionIdleTimeout =
        $scope.realm.ssoSessionIdleTimeout.toSeconds();
      $scope.realm.ssoSessionMaxLifespan =
        $scope.realm.ssoSessionMaxLifespan.toSeconds();
      $scope.realm.ssoSessionIdleTimeoutRememberMe =
        $scope.realm.ssoSessionIdleTimeoutRememberMe.toSeconds();
      $scope.realm.ssoSessionMaxLifespanRememberMe =
        $scope.realm.ssoSessionMaxLifespanRememberMe.toSeconds();
      $scope.realm.offlineSessionIdleTimeout =
        $scope.realm.offlineSessionIdleTimeout.toSeconds();
      // KEYCLOAK-7688 Offline Session Max for Offline Token
      $scope.realm.offlineSessionMaxLifespan =
        $scope.realm.offlineSessionMaxLifespan.toSeconds();
      $scope.realm.clientSessionIdleTimeout =
        $scope.realm.clientSessionIdleTimeout.toSeconds();
      $scope.realm.clientSessionMaxLifespan =
        $scope.realm.clientSessionMaxLifespan.toSeconds();
      $scope.realm.clientOfflineSessionIdleTimeout =
        $scope.realm.clientOfflineSessionIdleTimeout.toSeconds();
      $scope.realm.clientOfflineSessionMaxLifespan =
        $scope.realm.clientOfflineSessionMaxLifespan.toSeconds();
      $scope.realm.accessCodeLifespan =
        $scope.realm.accessCodeLifespan.toSeconds();
      $scope.realm.accessCodeLifespanUserAction =
        $scope.realm.accessCodeLifespanUserAction.toSeconds();
      $scope.realm.accessCodeLifespanLogin =
        $scope.realm.accessCodeLifespanLogin.toSeconds();
      $scope.realm.actionTokenGeneratedByAdminLifespan =
        $scope.realm.actionTokenGeneratedByAdminLifespan.toSeconds();
      $scope.realm.actionTokenGeneratedByUserLifespan =
        $scope.realm.actionTokenGeneratedByUserLifespan.toSeconds();
      $scope.realm.oauth2DeviceCodeLifespan =
        $scope.realm.oauth2DeviceCodeLifespan.toSeconds();

      Realm.update($scope.realm, () => {
        $route.reload();
        Notifications.success('The changes have been saved to the realm.');
      });
    };

    $scope.resetToDefaultToken = (_actionTokenId) => {
      $scope.actionTokenAttribute = {};
      delete $scope.realm.attributes[
        `actionTokenGeneratedByUserLifespan.${$scope.actionLifespanId}`
      ];
      //Only for UI effects, resets to the original state
      $scope.actionTokenAttribute.unit = 'Minutes';
    };

    $scope.reset = () => {
      $route.reload();
    };
  },
);

module.controller('ViewKeyCtrl', ($scope, key) => {
  $scope.key = key;
});

module.controller(
  'RealmKeysCtrl',
  (
    $scope,
    _Realm,
    realm,
    _$http,
    _$route,
    _$location,
    _Dialog,
    _Notifications,
    _serverInfo,
    keys,
    Components,
    $modal,
  ) => {
    $scope.realm = angular.copy(realm);
    $scope.keys = keys.keys;
    $scope.active = {};

    Components.query(
      {
        realm: realm.realm,
        parent: realm.id,
        type: 'org.keycloak.keys.KeyProvider',
      },
      (data) => {
        for (var i = 0; i < keys.keys.length; i++) {
          for (var j = 0; j < data.length; j++) {
            if (keys.keys[i].providerId === data[j].id) {
              keys.keys[i].provider = data[j];
            }
          }
        }

        for (var t in keys.active) {
          for (var i = 0; i < keys.keys.length; i++) {
            if (keys.active[t] === keys.keys[i].kid) {
              $scope.active[t] = keys.keys[i];
            }
          }
        }
      },
    );

    $scope.viewKey = (key) => {
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/view-key.html`,
        controller: 'ViewKeyCtrl',
        resolve: {
          key: () => key,
        },
      });
    };
  },
);

module.controller(
  'RealmKeysProvidersCtrl',
  (
    $scope,
    _Realm,
    realm,
    _$http,
    $route,
    $location,
    Dialog,
    Notifications,
    serverInfo,
    Components,
    _$modal,
  ) => {
    $scope.realm = angular.copy(realm);
    $scope.enableUpload = false;

    $scope.providers =
      serverInfo.componentTypes['org.keycloak.keys.KeyProvider'];

    Components.query(
      {
        realm: realm.realm,
        parent: realm.id,
        type: 'org.keycloak.keys.KeyProvider',
      },
      (data) => {
        $scope.instances = data;

        for (var i = 0; i < $scope.instances.length; i++) {
          for (var j = 0; j < $scope.providers.length; j++) {
            if ($scope.providers[j].id === $scope.instances[i].providerId) {
              $scope.instances[i].provider = $scope.providers[j];
            }
          }
        }
      },
    );

    $scope.addProvider = (provider) => {
      $location.url(`/create/keys/${realm.realm}/providers/${provider.id}`);
    };

    $scope.removeInstance = (instance) => {
      Dialog.confirmDelete(instance.name, 'key provider', () => {
        Components.remove(
          {
            realm: realm.realm,
            componentId: instance.id,
          },
          () => {
            $route.reload();
            Notifications.success('The provider has been deleted.');
          },
        );
      });
    };
  },
);

module.controller(
  'GenericKeystoreCtrl',
  (
    $scope,
    $location,
    Notifications,
    $route,
    _Dialog,
    realm,
    serverInfo,
    instance,
    providerId,
    Components,
  ) => {
    $scope.create = !instance.providerId;
    $scope.realm = realm;

    var providers = serverInfo.componentTypes['org.keycloak.keys.KeyProvider'];
    var providerFactory = null;
    for (var i = 0; i < providers.length; i++) {
      var p = providers[i];
      if (p.id === providerId) {
        $scope.providerFactory = p;
        providerFactory = p;
        break;
      }
    }

    if ($scope.create) {
      $scope.instance = {
        name: providerFactory.id,
        providerId: providerFactory.id,
        providerType: 'org.keycloak.keys.KeyProvider',
        parentId: realm.id,
        config: {
          priority: ['0'],
        },
      };
    } else {
      $scope.instance = angular.copy(instance);
    }

    if (providerFactory.properties) {
      for (var i = 0; i < providerFactory.properties.length; i++) {
        var configProperty = providerFactory.properties[i];
        if (!$scope.instance.config[configProperty.name]) {
          if (configProperty.defaultValue) {
            $scope.instance.config[configProperty.name] = [
              configProperty.defaultValue,
            ];
            if (!$scope.create) {
              instance.config[configProperty.name] = [
                configProperty.defaultValue,
              ];
            }
          } else {
            $scope.instance.config[configProperty.name] = [''];
            if (!$scope.create) {
              instance.config[configProperty.name] = [
                configProperty.defaultValue,
              ];
            }
          }
        }
      }
    }

    $scope.$watch(
      'instance',
      () => {
        if (!angular.equals($scope.instance, instance)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      $scope.changed = false;
      if ($scope.create) {
        Components.save(
          { realm: realm.realm },
          $scope.instance,
          (_data, headers) => {
            var l = headers().location;
            var id = l.substring(l.lastIndexOf('/') + 1);

            $location.url(
              `/realms/${realm.realm}/keys/providers/${$scope.instance.providerId}/${id}`,
            );
            Notifications.success('The provider has been created.');
          },
        );
      } else {
        Components.update(
          { realm: realm.realm, componentId: instance.id },
          $scope.instance,
          () => {
            $route.reload();
            Notifications.success('The provider has been updated.');
          },
        );
      }
    };

    $scope.reset = () => {
      $route.reload();
    };

    $scope.cancel = () => {
      if ($scope.create) {
        $location.url(`/realms/${realm.realm}/keys`);
      } else {
        $route.reload();
      }
    };
  },
);

module.controller(
  'RealmSessionStatsCtrl',
  (
    $scope,
    realm,
    stats,
    _RealmClientSessionStats,
    RealmLogoutAll,
    Notifications,
  ) => {
    $scope.realm = realm;
    $scope.stats = stats;

    $scope.logoutAll = () => {
      RealmLogoutAll.save({ realm: realm.realm }, (globalReqResult) => {
        var successCount = globalReqResult.successRequests
          ? globalReqResult.successRequests.length
          : 0;
        var failedCount = globalReqResult.failedRequests
          ? globalReqResult.failedRequests.length
          : 0;

        if (failedCount > 0) {
          var msgStart =
            successCount > 0
              ? `Successfully logout all users under: ${globalReqResult.successRequests} . `
              : '';
          Notifications.error(
            `${msgStart}Failed to logout users under: ${globalReqResult.failedRequests}. Verify availability of failed hosts and try again`,
          );
        } else {
          window.location.reload();
        }
      });
    };
  },
);

module.controller(
  'RealmRevocationCtrl',
  (
    $scope,
    Realm,
    RealmPushRevocation,
    realm,
    _$http,
    _$location,
    _Dialog,
    Notifications,
  ) => {
    $scope.realm = angular.copy(realm);

    var setNotBefore = () => {
      if ($scope.realm.notBefore === 0) {
        $scope.notBefore = 'None';
      } else {
        $scope.notBefore = new Date($scope.realm.notBefore * 1000);
      }
    };

    setNotBefore();

    var reset = () => {
      Realm.get({ id: realm.realm }, (updated) => {
        $scope.realm = updated;
        setNotBefore();
      });
    };

    $scope.clear = () => {
      Realm.update({ realm: realm.realm, notBefore: 0 }, () => {
        $scope.notBefore = 'None';
        Notifications.success('Not Before cleared for realm.');
        reset();
      });
    };
    $scope.setNotBeforeNow = () => {
      Realm.update({ realm: realm.realm, notBefore: Date.now() / 1000 }, () => {
        Notifications.success('Not Before set for realm.');
        reset();
      });
    };
    $scope.pushRevocation = () => {
      RealmPushRevocation.save({ realm: realm.realm }, (globalReqResult) => {
        var successCount = globalReqResult.successRequests
          ? globalReqResult.successRequests.length
          : 0;
        var failedCount = globalReqResult.failedRequests
          ? globalReqResult.failedRequests.length
          : 0;

        if (successCount === 0 && failedCount === 0) {
          Notifications.warn(
            'No push sent. No admin URI configured or no registered cluster nodes available',
          );
        } else if (failedCount > 0) {
          var msgStart =
            successCount > 0
              ? `Successfully push notBefore to: ${globalReqResult.successRequests} . `
              : '';
          Notifications.error(
            `${msgStart}Failed to push notBefore to: ${globalReqResult.failedRequests}. Verify availability of failed hosts and try again`,
          );
        } else {
          Notifications.success(
            'Successfully push notBefore to all configured clients',
          );
        }
      });
    };
  },
);

module.controller(
  'RoleTabCtrl',
  (Dialog, $scope, _Current, Notifications, _$location) => {
    $scope.removeRole = () => {
      Dialog.confirmDelete($scope.role.name, 'role', () => {
        RoleById.remove(
          {
            realm: realm.realm,
            role: $scope.role.id,
          },
          () => {
            $route.reload();
            Notifications.success('The role has been deleted.');
          },
        );
      });
    };
  },
);

module.controller(
  'RoleListCtrl',
  (
    $scope,
    $route,
    Dialog,
    Notifications,
    realm,
    RoleList,
    RoleById,
    _filterFilter,
  ) => {
    $scope.realm = realm;
    $scope.roles = [];
    $scope.defaultRoleName = realm.defaultRole.name;

    $scope.query = {
      realm: realm.realm,
      search: null,
      max: 20,
      first: 0,
    };

    $scope.$watch(
      'query.search',
      (_newVal, _oldVal) => {
        if ($scope.query.search && $scope.query.search.length >= 3) {
          $scope.firstPage();
        }
      },
      true,
    );

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.searchQuery();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.searchQuery();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.searchQuery();
    };

    $scope.searchQuery = () => {
      $scope.searchLoaded = false;

      $scope.roles = RoleList.query($scope.query, () => {
        $scope.searchLoaded = true;
        $scope.lastSearch = $scope.query.search;
      });
    };

    $scope.searchQuery();

    $scope.determineEditLink = (role) =>
      role.name === $scope.defaultRoleName
        ? `/realms/${$scope.realm.realm}/default-roles`
        : `/realms/${$scope.realm.realm}/roles/${role.id}`;

    $scope.removeRole = (role) => {
      if (role.name === $scope.defaultRoleName) return;

      Dialog.confirmDelete(role.name, 'role', () => {
        RoleById.remove(
          {
            realm: realm.realm,
            role: role.id,
          },
          () => {
            $route.reload();
            Notifications.success('The role has been deleted.');
          },
        );
      });
    };
  },
);

module.controller(
  'RoleDetailCtrl',
  (
    $scope,
    realm,
    role,
    roles,
    Client,
    $route,
    Role,
    ClientRole,
    RoleById,
    RoleRealmComposites,
    RoleClientComposites,
    $http,
    $location,
    Dialog,
    Notifications,
    RealmRoleRemover,
    ComponentUtils,
  ) => {
    $scope.realm = realm;
    $scope.role = angular.copy(role);
    $scope.create = !role.name;

    $scope.changed = $scope.create;

    $scope.save = () => {
      convertAttributeValuesToLists();
      console.log('save');
      if ($scope.create) {
        Role.save(
          {
            realm: realm.realm,
          },
          $scope.role,
          (_data, _headers) => {
            $scope.changed = false;
            convertAttributeValuesToString($scope.role);
            role = angular.copy($scope.role);

            Role.get({ realm: realm.realm, role: role.name }, (role) => {
              var id = role.id;
              $location.url(`/realms/${realm.realm}/roles/${id}`);
              Notifications.success('The role has been created.');
            });
          },
        );
      } else {
        $scope.update();
      }
    };

    $scope.remove = () => {
      RealmRoleRemover.remove(
        $scope.role,
        realm,
        Dialog,
        $location,
        Notifications,
      );
    };

    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/roles`);
    };

    $scope.addAttribute = () => {
      $scope.role.attributes[$scope.newAttribute.key] =
        $scope.newAttribute.value;
      delete $scope.newAttribute;
    };

    $scope.removeAttribute = (key) => {
      delete $scope.role.attributes[key];
    };

    function convertAttributeValuesToLists() {
      var attrs = $scope.role.attributes;
      for (var attribute in attrs) {
        if (typeof attrs[attribute] === 'string') {
          var attrVals = attrs[attribute].split('##');
          attrs[attribute] = attrVals;
        }
      }
    }

    function convertAttributeValuesToString(role) {
      var attrs = role.attributes;
      for (var attribute in attrs) {
        if (typeof attrs[attribute] === 'object') {
          var attrVals = attrs[attribute].join('##');
          attrs[attribute] = attrVals;
          console.log(`attribute${attrVals}`);
        }
      }
    }

    roleControl(
      $scope,
      $route,
      realm,
      role,
      roles,
      Client,
      ClientRole,
      RoleById,
      RoleRealmComposites,
      RoleClientComposites,
      $http,
      $location,
      Notifications,
      Dialog,
      ComponentUtils,
    );
  },
);

module.controller(
  'RealmSMTPSettingsCtrl',
  (
    $scope,
    _Current,
    Realm,
    realm,
    _$http,
    $location,
    _Dialog,
    Notifications,
    RealmSMTPConnectionTester,
  ) => {
    console.log('RealmSMTPSettingsCtrl');

    var booleanSmtpAtts = ['auth', 'ssl', 'starttls'];

    $scope.realm = realm;

    if ($scope.realm.smtpServer) {
      $scope.realm.smtpServer = typeObject($scope.realm.smtpServer);
    }

    var oldCopy = angular.copy($scope.realm);
    $scope.changed = false;

    $scope.$watch(
      'realm',
      () => {
        if (!angular.equals($scope.realm, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      var realmCopy = angular.copy($scope.realm);
      realmCopy['smtpServer'] = detypeObject(realmCopy.smtpServer);
      $scope.changed = false;
      Realm.update(realmCopy, () => {
        $location.url(`/realms/${realm.realm}/smtp-settings`);
        Notifications.success('Your changes have been saved to the realm.');
      });
    };

    $scope.reset = () => {
      $scope.realm = angular.copy(oldCopy);
      $scope.changed = false;
    };

    $scope.testConnection = () => {
      RealmSMTPConnectionTester.save(
        { realm: realm.realm },
        realm.smtpServer,
        () => {
          Notifications.success('SMTP connection successful. E-mail was sent!');
        },
        (_errorResponse) => {
          if (error.data.errorMessage) {
            Notifications.error(error.data.errorMessage);
          } else {
            Notifications.error('Unexpected error during SMTP validation');
          }
        },
      );
    };

    /* Convert string attributes containing a boolean to actual boolean type + convert an integer string (port) to integer. */
    function typeObject(obj) {
      for (var att in obj) {
        if (booleanSmtpAtts.indexOf(att) < 0) continue;
        if (obj[att] === 'true') {
          obj[att] = true;
        } else if (obj[att] === 'false') {
          obj[att] = false;
        }
      }

      obj['port'] = parseInt(obj['port'], 10);

      return obj;
    }

    /* Convert all non-string values to strings to invert changes caused by the typeObject function. */
    function detypeObject(obj) {
      for (var att in obj) {
        if (booleanSmtpAtts.indexOf(att) < 0) continue;
        if (obj[att] === true) {
          obj[att] = 'true';
        } else if (obj[att] === false) {
          obj[att] = 'false';
        }
      }

      obj['port'] = obj['port']?.toString();

      return obj;
    }
  },
);

module.controller(
  'RealmEventsConfigCtrl',
  (
    $scope,
    eventsConfig,
    RealmEventsConfig,
    RealmEvents,
    RealmAdminEvents,
    realm,
    serverInfo,
    $location,
    Notifications,
    TimeUnit,
    Dialog,
  ) => {
    $scope.realm = realm;

    $scope.eventsConfig = eventsConfig;

    $scope.eventsConfig.expirationUnit = TimeUnit.autoUnit(
      eventsConfig.eventsExpiration,
    );
    $scope.eventsConfig.eventsExpiration = TimeUnit.toUnit(
      eventsConfig.eventsExpiration,
      $scope.eventsConfig.expirationUnit,
    );

    $scope.eventListeners = Object.keys(
      serverInfo.providers.eventsListener.providers,
    );

    $scope.eventsConfigSelectOptions = {
      multiple: true,
      simple_tags: true,
      tags: $scope.eventListeners,
    };

    $scope.eventSelectOptions = {
      multiple: true,
      simple_tags: true,
      tags: serverInfo.enums['eventType'],
    };

    var oldCopy = angular.copy($scope.eventsConfig);
    $scope.changed = false;

    $scope.$watch(
      'eventsConfig',
      () => {
        if (!angular.equals($scope.eventsConfig, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      $scope.changed = false;

      var copy = angular.copy($scope.eventsConfig);
      delete copy['expirationUnit'];

      copy.eventsExpiration = TimeUnit.toSeconds(
        $scope.eventsConfig.eventsExpiration,
        $scope.eventsConfig.expirationUnit,
      );

      RealmEventsConfig.update(
        {
          id: realm.realm,
        },
        copy,
        () => {
          $location.url(`/realms/${realm.realm}/events-settings`);
          Notifications.success('Your changes have been saved to the realm.');
        },
      );
    };

    $scope.reset = () => {
      $scope.eventsConfig = angular.copy(oldCopy);
      $scope.changed = false;
    };

    $scope.clearEvents = () => {
      Dialog.confirmDelete($scope.realm.realm, 'events', () => {
        RealmEvents.remove({ id: $scope.realm.realm }, () => {
          Notifications.success('The events has been cleared.');
        });
      });
    };

    $scope.clearAdminEvents = () => {
      Dialog.confirmDelete($scope.realm.realm, 'admin-events', () => {
        RealmAdminEvents.remove({ id: $scope.realm.realm }, () => {
          Notifications.success('The admin events has been cleared.');
        });
      });
    };
  },
);

module.controller(
  'RealmEventsCtrl',
  ($scope, RealmEvents, realm, serverInfo) => {
    $scope.realm = realm;
    $scope.page = 0;

    $scope.eventSelectOptions = {
      multiple: true,
      simple_tags: true,
      tags: serverInfo.enums['eventType'],
    };

    $scope.query = {
      id: realm.realm,
      max: 5,
      first: 0,
    };

    $scope.disablePaste = (e) => {
      e.preventDefault();
      return false;
    };

    $scope.update = () => {
      $scope.query.first = 0;
      for (var i in $scope.query) {
        if ($scope.query[i] === '') {
          delete $scope.query[i];
        }
      }
      $scope.events = RealmEvents.query($scope.query);
    };

    $scope.reset = () => {
      $scope.query.first = 0;
      $scope.query.max = 5;
      $scope.query.type = '';
      $scope.query.client = '';
      $scope.query.user = '';
      $scope.query.dateFrom = '';
      $scope.query.dateTo = '';

      $scope.update();
    };

    $scope.queryUpdate = () => {
      for (var i in $scope.query) {
        if ($scope.query[i] === '') {
          delete $scope.query[i];
        }
      }
      $scope.events = RealmEvents.query($scope.query);
    };

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.queryUpdate();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.queryUpdate();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.queryUpdate();
    };

    $scope.update();
  },
);

module.controller(
  'RealmAdminEventsCtrl',
  ($scope, RealmAdminEvents, realm, serverInfo, $modal, _$filter) => {
    $scope.realm = realm;
    $scope.page = 0;

    $scope.query = {
      id: realm.realm,
      max: 5,
      first: 0,
    };

    $scope.adminEnabledEventOperationsOptions = {
      multiple: true,
      simple_tags: true,
      tags: serverInfo.enums['operationType'],
    };

    $scope.adminEnabledEventResourceTypesOptions = {
      multiple: true,
      simple_tags: true,
      tags: serverInfo.enums['resourceType'],
    };

    $scope.disablePaste = (e) => {
      e.preventDefault();
      return false;
    };

    $scope.update = () => {
      $scope.query.first = 0;
      for (var i in $scope.query) {
        if ($scope.query[i] === '') {
          delete $scope.query[i];
        }
      }
      $scope.events = RealmAdminEvents.query($scope.query);
    };

    $scope.reset = () => {
      $scope.query.first = 0;
      $scope.query.max = 5;
      $scope.query.operationTypes = '';
      $scope.query.resourceTypes = '';
      $scope.query.resourcePath = '';
      $scope.query.authRealm = '';
      $scope.query.authClient = '';
      $scope.query.authUser = '';
      $scope.query.authIpAddress = '';
      $scope.query.dateFrom = '';
      $scope.query.dateTo = '';

      $scope.update();
    };

    $scope.queryUpdate = () => {
      for (var i in $scope.query) {
        if ($scope.query[i] === '') {
          delete $scope.query[i];
        }
      }
      $scope.events = RealmAdminEvents.query($scope.query);
    };

    $scope.firstPage = () => {
      $scope.query.first = 0;
      $scope.queryUpdate();
    };

    $scope.previousPage = () => {
      $scope.query.first -= parseInt($scope.query.max, 10);
      if ($scope.query.first < 0) {
        $scope.query.first = 0;
      }
      $scope.queryUpdate();
    };

    $scope.nextPage = () => {
      $scope.query.first += parseInt($scope.query.max, 10);
      $scope.queryUpdate();
    };

    $scope.update();

    $scope.viewRepresentation = (event) => {
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/realm-events-admin-representation.html`,
        controller: 'RealmAdminEventsModalCtrl',
        resolve: {
          event: () => event,
        },
      });
    };

    $scope.viewAuth = (event) => {
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/realm-events-admin-auth.html`,
        controller: 'RealmAdminEventsModalCtrl',
        resolve: {
          event: () => event,
        },
      });
    };
  },
);

module.controller('RealmAdminEventsModalCtrl', ($scope, _$filter, event) => {
  $scope.event = event;
});

module.controller(
  'RealmBruteForceCtrl',
  (
    $scope,
    Realm,
    realm,
    _$http,
    $location,
    _Dialog,
    Notifications,
    TimeUnit,
    $route,
  ) => {
    console.log('RealmBruteForceCtrl');

    $scope.realm = realm;

    $scope.realm.waitIncrementUnit = TimeUnit.autoUnit(
      realm.waitIncrementSeconds,
    );
    $scope.realm.waitIncrement = TimeUnit.toUnit(
      realm.waitIncrementSeconds,
      $scope.realm.waitIncrementUnit,
    );

    $scope.realm.minimumQuickLoginWaitUnit = TimeUnit.autoUnit(
      realm.minimumQuickLoginWaitSeconds,
    );
    $scope.realm.minimumQuickLoginWait = TimeUnit.toUnit(
      realm.minimumQuickLoginWaitSeconds,
      $scope.realm.minimumQuickLoginWaitUnit,
    );

    $scope.realm.maxFailureWaitUnit = TimeUnit.autoUnit(
      realm.maxFailureWaitSeconds,
    );
    $scope.realm.maxFailureWait = TimeUnit.toUnit(
      realm.maxFailureWaitSeconds,
      $scope.realm.maxFailureWaitUnit,
    );

    $scope.realm.maxDeltaTimeUnit = TimeUnit.autoUnit(
      realm.maxDeltaTimeSeconds,
    );
    $scope.realm.maxDeltaTime = TimeUnit.toUnit(
      realm.maxDeltaTimeSeconds,
      $scope.realm.maxDeltaTimeUnit,
    );

    var oldCopy = angular.copy($scope.realm);
    $scope.changed = false;

    $scope.$watch(
      'realm',
      () => {
        if (!angular.equals($scope.realm, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      var realmCopy = angular.copy($scope.realm);
      delete realmCopy['waitIncrementUnit'];
      delete realmCopy['waitIncrement'];
      delete realmCopy['minimumQuickLoginWaitUnit'];
      delete realmCopy['minimumQuickLoginWait'];
      delete realmCopy['maxFailureWaitUnit'];
      delete realmCopy['maxFailureWait'];
      delete realmCopy['maxDeltaTimeUnit'];
      delete realmCopy['maxDeltaTime'];

      realmCopy.waitIncrementSeconds = TimeUnit.toSeconds(
        $scope.realm.waitIncrement,
        $scope.realm.waitIncrementUnit,
      );
      realmCopy.minimumQuickLoginWaitSeconds = TimeUnit.toSeconds(
        $scope.realm.minimumQuickLoginWait,
        $scope.realm.minimumQuickLoginWaitUnit,
      );
      realmCopy.maxFailureWaitSeconds = TimeUnit.toSeconds(
        $scope.realm.maxFailureWait,
        $scope.realm.maxFailureWaitUnit,
      );
      realmCopy.maxDeltaTimeSeconds = TimeUnit.toSeconds(
        $scope.realm.maxDeltaTime,
        $scope.realm.maxDeltaTimeUnit,
      );

      $scope.changed = false;
      Realm.update(realmCopy, () => {
        oldCopy = angular.copy($scope.realm);
        $location.url(`/realms/${realm.realm}/defense/brute-force`);
        Notifications.success('Your changes have been saved to the realm.');
      });
    };

    $scope.reset = () => {
      $route.reload();
    };
  },
);

module.controller(
  'IdentityProviderMapperListCtrl',
  ($scope, realm, identityProvider, mapperTypes, mappers) => {
    $scope.realm = realm;
    $scope.identityProvider = identityProvider;
    $scope.mapperTypes = mapperTypes;
    $scope.mappers = mappers;
  },
);

module.controller(
  'IdentityProviderMapperCtrl',
  (
    $scope,
    realm,
    identityProvider,
    mapperTypes,
    mapper,
    IdentityProviderMapper,
    Notifications,
    Dialog,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.identityProvider = identityProvider;
    $scope.create = false;
    $scope.mapper = angular.copy(mapper);
    $scope.changed = false;
    $scope.mapperType = mapperTypes[mapper.identityProviderMapper];
    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.$watch(
      'mapper',
      () => {
        if (!angular.equals($scope.mapper, mapper)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      IdentityProviderMapper.update(
        {
          realm: realm.realm,
          alias: identityProvider.alias,
          mapperId: mapper.id,
        },
        $scope.mapper,
        () => {
          $scope.changed = false;
          mapper = angular.copy($scope.mapper);
          $location.url(
            `/realms/${realm.realm}/identity-provider-mappers/${identityProvider.alias}/mappers/${mapper.id}`,
          );
          Notifications.success('Your changes have been saved.');
        },
      );
    };

    $scope.reset = () => {
      $scope.mapper = angular.copy(mapper);
      $scope.changed = false;
    };

    $scope.cancel = () => {
      //$location.url("/realms");
      window.history.back();
    };

    $scope.remove = () => {
      Dialog.confirmDelete($scope.mapper.name, 'mapper', () => {
        IdentityProviderMapper.remove(
          {
            realm: realm.realm,
            alias: mapper.identityProviderAlias,
            mapperId: $scope.mapper.id,
          },
          () => {
            Notifications.success('The mapper has been deleted.');
            $location.url(
              `/realms/${realm.realm}/identity-provider-mappers/${identityProvider.alias}/mappers`,
            );
          },
        );
      });
    };
  },
);

module.controller(
  'IdentityProviderMapperCreateCtrl',
  (
    $scope,
    realm,
    identityProvider,
    mapperTypes,
    IdentityProviderMapper,
    Notifications,
    _Dialog,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.identityProvider = identityProvider;
    $scope.create = true;
    $scope.mapper = {
      identityProviderAlias: identityProvider.alias,
      config: {},
    };
    $scope.mapperTypes = mapperTypes;

    // make first type the default
    $scope.mapperType = mapperTypes[Object.keys(mapperTypes)[0]];
    $scope.mapper.config.syncMode = 'INHERIT';

    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.save = () => {
      $scope.mapper.identityProviderMapper = $scope.mapperType.id;
      IdentityProviderMapper.save(
        {
          realm: realm.realm,
          alias: identityProvider.alias,
        },
        $scope.mapper,
        (_data, headers) => {
          var l = headers().location;
          var id = l.substring(l.lastIndexOf('/') + 1);
          $location.url(
            `/realms/${realm.realm}/identity-provider-mappers/${identityProvider.alias}/mappers/${id}`,
          );
          Notifications.success('Mapper has been created.');
        },
      );
    };

    $scope.cancel = () => {
      //$location.url("/realms");
      window.history.back();
    };
  },
);

module.controller(
  'RealmFlowBindingCtrl',
  (
    $scope,
    flows,
    Current,
    Realm,
    realm,
    serverInfo,
    $http,
    $route,
    Dialog,
    Notifications,
  ) => {
    $scope.flows = [];
    $scope.clientFlows = [];
    for (var i = 0; i < flows.length; i++) {
      if (flows[i].providerId === 'client-flow') {
        $scope.clientFlows.push(flows[i]);
      } else {
        $scope.flows.push(flows[i]);
      }
    }

    $scope.profileInfo = serverInfo.profileInfo;

    genericRealmUpdate(
      $scope,
      Current,
      Realm,
      realm,
      serverInfo,
      $http,
      $route,
      Dialog,
      Notifications,
      `/realms/${realm.realm}/authentication/flow-bindings`,
    );
  },
);

module.controller(
  'CreateFlowCtrl',
  ($scope, realm, AuthenticationFlows, Notifications, $location) => {
    console.debug('CreateFlowCtrl');
    $scope.realm = realm;
    $scope.flow = {
      alias: '',
      providerId: 'basic-flow',
      description: '',
      topLevel: true,
      builtIn: false,
    };

    $scope.save = () => {
      AuthenticationFlows.save(
        { realm: realm.realm, flow: '' },
        $scope.flow,
        () => {
          $location.url(
            `/realms/${realm.realm}/authentication/flows/${$scope.flow.alias}`,
          );
          Notifications.success('Flow Created.');
        },
      );
    };
    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/authentication/flows`);
    };
  },
);

module.controller(
  'CreateExecutionFlowCtrl',
  (
    $scope,
    realm,
    parentFlow,
    formProviders,
    CreateExecutionFlow,
    Notifications,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.formProviders = formProviders;

    var defaultFlowType =
      parentFlow.providerId === 'client-flow' ? 'client-flow' : 'basic-flow';
    $scope.flow = {
      alias: '',
      type: defaultFlowType,
      description: '',
    };
    $scope.provider = {};
    if (formProviders.length > 0) {
      $scope.provider = formProviders[0];
    }

    $scope.save = () => {
      $scope.flow.provider = $scope.provider.id;
      CreateExecutionFlow.save(
        { realm: realm.realm, alias: parentFlow.alias },
        $scope.flow,
        () => {
          $location.url(`/realms/${realm.realm}/authentication/flows`);
          Notifications.success('Flow Created.');
        },
      );
    };
    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/authentication/flows`);
    };
  },
);

module.controller(
  'CreateExecutionCtrl',
  (
    $scope,
    realm,
    parentFlow,
    formActionProviders,
    authenticatorProviders,
    clientAuthenticatorProviders,
    CreateExecution,
    Notifications,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.parentFlow = parentFlow;

    if (parentFlow.providerId === 'form-flow') {
      $scope.providers = formActionProviders;
    } else if (parentFlow.providerId === 'client-flow') {
      $scope.providers = clientAuthenticatorProviders;
    } else {
      $scope.providers = authenticatorProviders;
    }

    $scope.provider = {};
    if ($scope.providers.length > 0) {
      $scope.provider = $scope.providers[0];
    }

    $scope.save = () => {
      var execution = {
        provider: $scope.provider.id,
      };
      CreateExecution.save(
        { realm: realm.realm, alias: parentFlow.alias },
        execution,
        () => {
          $location.url(`/realms/${realm.realm}/authentication/flows`);
          Notifications.success('Execution Created.');
        },
      );
    };
    $scope.cancel = () => {
      $location.url(`/realms/${realm.realm}/authentication/flows`);
    };
  },
);

module.controller(
  'AuthenticationFlowsCtrl',
  (
    $scope,
    _$route,
    realm,
    flows,
    selectedFlow,
    LastFlowSelected,
    Dialog,
    AuthenticationFlows,
    AuthenticationFlowsCopy,
    AuthenticationFlowsUpdate,
    AuthenticationFlowExecutions,
    AuthenticationExecution,
    AuthenticationExecutionRaisePriority,
    AuthenticationExecutionLowerPriority,
    _$modal,
    Notifications,
    CopyDialog,
    UpdateDialog,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.flows = flows;

    if (selectedFlow !== null) {
      LastFlowSelected.alias = selectedFlow;
    }

    if (selectedFlow === null && LastFlowSelected.alias !== null) {
      selectedFlow = LastFlowSelected.alias;
    }

    if (flows.length > 0) {
      $scope.flow = flows[0];
      if (selectedFlow) {
        for (var i = 0; i < flows.length; i++) {
          if (flows[i].alias === selectedFlow) {
            $scope.flow = flows[i];
            break;
          }
        }
      }
    }

    $scope.selectFlow = (flow) => {
      $location.url(
        `/realms/${realm.realm}/authentication/flows/${flow.alias}`,
      );
    };

    var setupForm = () => {
      AuthenticationFlowExecutions.query(
        { realm: realm.realm, alias: $scope.flow.alias },
        (data) => {
          $scope.executions = data;
          $scope.choicesmax = 0;
          $scope.levelmax = 0;
          for (var i = 0; i < $scope.executions.length; i++) {
            var execution = $scope.executions[i];
            if (execution.requirementChoices.length > $scope.choicesmax) {
              $scope.choicesmax = execution.requirementChoices.length;
            }
            if (execution.level > $scope.levelmax) {
              $scope.levelmax = execution.level;
            }
          }
          $scope.levelmaxempties = [];
          for (j = 0; j < $scope.levelmax; j++) {
            $scope.levelmaxempties.push(j);
          }
          for (var i = 0; i < $scope.executions.length; i++) {
            var execution = $scope.executions[i];
            execution.empties = [];
            for (
              j = 0;
              j < $scope.choicesmax - execution.requirementChoices.length;
              j++
            ) {
              execution.empties.push(j);
            }
            execution.preLevels = [];
            for (j = 0; j < execution.level; j++) {
              execution.preLevels.push(j);
            }
            execution.postLevels = [];
            for (j = execution.level; j < $scope.levelmax; j++) {
              execution.postLevels.push(j);
            }
          }
        },
      );
    };

    $scope.copyFlow = () => {
      CopyDialog.open('Copy Authentication Flow', $scope.flow.alias, (name) => {
        AuthenticationFlowsCopy.save(
          { realm: realm.realm, alias: $scope.flow.alias },
          {
            newName: name,
          },
          () => {
            $location.url(
              `/realms/${realm.realm}/authentication/flows/${name}`,
            );
            Notifications.success('Flow copied.');
          },
        );
      });
    };

    $scope.deleteFlow = () => {
      Dialog.confirmDelete($scope.flow.alias, 'flow', () => {
        $scope.removeFlow();
      });
    };

    $scope.removeFlow = () => {
      console.log(`Remove flow:${$scope.flow.alias}`);
      if (realm.browserFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the browser flow.',
        );
      } else if (realm.registrationFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the registration flow.',
        );
      } else if (realm.directGrantFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the direct grant flow.',
        );
      } else if (realm.resetCredentialsFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the reset credentials flow.',
        );
      } else if (realm.clientAuthenticationFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the client authentication flow.',
        );
      } else if (realm.dockerAuthenticationFlow === $scope.flow.alias) {
        Notifications.error(
          'Cannot remove flow, it is currently being used as the docker authentication flow.',
        );
      } else {
        AuthenticationFlows.remove(
          { realm: realm.realm, flow: $scope.flow.id },
          () => {
            $location.url(
              `/realms/${realm.realm}/authentication/flows/${flows[0].alias}`,
            );
            Notifications.success('Flow removed');
          },
        );
      }
    };

    $scope.editFlow = (flow) => {
      var copy = angular.copy(flow);
      UpdateDialog.open(
        'Update Authentication Flow',
        copy.alias,
        copy.description,
        (name, desc) => {
          copy.alias = name;
          copy.description = desc;
          AuthenticationFlowsUpdate.update(
            { realm: realm.realm, flow: flow.id },
            copy,
            () => {
              $location.url(
                `/realms/${realm.realm}/authentication/flows/${name}`,
              );
              Notifications.success('Flow updated');
            },
          );
        },
      );
    };

    $scope.addFlow = () => {
      $location.url(
        `/realms/${realm.realm}/authentication/flows/${$scope.flow.id}/create/flow/execution/${$scope.flow.id}`,
      );
    };

    $scope.addSubFlow = (execution) => {
      $location.url(
        `/realms/${realm.realm}/authentication/flows/${execution.flowId}/create/flow/execution/${$scope.flow.alias}`,
      );
    };

    $scope.addSubFlowExecution = (execution) => {
      $location.url(
        `/realms/${realm.realm}/authentication/flows/${execution.flowId}/create/execution/${$scope.flow.alias}`,
      );
    };

    $scope.addExecution = () => {
      $location.url(
        `/realms/${realm.realm}/authentication/flows/${$scope.flow.id}/create/execution/${$scope.flow.id}`,
      );
    };

    $scope.createFlow = () => {
      $location.url(`/realms/${realm.realm}/authentication/create/flow`);
    };

    $scope.updateExecution = (execution) => {
      var copy = angular.copy(execution);
      delete copy.empties;
      delete copy.levels;
      delete copy.preLevels;
      delete copy.postLevels;
      AuthenticationFlowExecutions.update(
        { realm: realm.realm, alias: $scope.flow.alias },
        copy,
        () => {
          Notifications.success('Auth requirement updated');
          setupForm();
        },
      );
    };

    $scope.editExecutionFlow = (execution) => {
      var copy = angular.copy(execution);
      delete copy.empties;
      delete copy.levels;
      delete copy.preLevels;
      delete copy.postLevels;
      UpdateDialog.open(
        'Update Execution Flow',
        copy.displayName,
        copy.description,
        (name, desc) => {
          copy.displayName = name;
          copy.description = desc;
          AuthenticationFlowExecutions.update(
            { realm: realm.realm, alias: $scope.flow.alias },
            copy,
            () => {
              Notifications.success('Execution Flow updated');
              setupForm();
            },
          );
        },
      );
    };

    $scope.removeExecution = (execution) => {
      console.log(`removeExecution: ${execution.id}`);
      var exeOrFlow = execution.authenticationFlow ? 'flow' : 'execution';
      Dialog.confirmDelete(execution.displayName, exeOrFlow, () => {
        AuthenticationExecution.remove(
          { realm: realm.realm, execution: execution.id },
          () => {
            Notifications.success(`The ${exeOrFlow} was removed.`);
            setupForm();
          },
        );
      });
    };

    $scope.raisePriority = (execution) => {
      AuthenticationExecutionRaisePriority.save(
        { realm: realm.realm, execution: execution.id },
        () => {
          Notifications.success('Priority raised');
          setupForm();
        },
      );
    };

    $scope.lowerPriority = (execution) => {
      AuthenticationExecutionLowerPriority.save(
        { realm: realm.realm, execution: execution.id },
        () => {
          Notifications.success('Priority lowered');
          setupForm();
        },
      );
    };

    $scope.setupForm = setupForm;

    if (selectedFlow == null) {
      $scope.selectFlow(flows[0]);
    } else {
      setupForm();
    }
  },
);

module.controller(
  'RequiredActionsCtrl',
  (
    $scope,
    realm,
    unregisteredRequiredActions,
    $modal,
    $route,
    RegisterRequiredAction,
    RequiredActions,
    RequiredActionRaisePriority,
    RequiredActionLowerPriority,
    Notifications,
  ) => {
    console.log('RequiredActionsCtrl');
    $scope.realm = realm;
    $scope.unregisteredRequiredActions = unregisteredRequiredActions;
    $scope.requiredActions = [];
    var setupRequiredActionsForm = () => {
      console.log('setupRequiredActionsForm');
      RequiredActions.query({ realm: realm.realm }, (data) => {
        $scope.requiredActions = [];
        for (var i = 0; i < data.length; i++) {
          $scope.requiredActions.push(data[i]);
        }
      });
    };

    $scope.updateRequiredAction = (action) => {
      RequiredActions.update(
        { realm: realm.realm, alias: action.alias },
        action,
        () => {
          Notifications.success('Required action updated');
          setupRequiredActionsForm();
        },
      );
    };

    $scope.raisePriority = (action) => {
      RequiredActionRaisePriority.save(
        { realm: realm.realm, alias: action.alias },
        () => {
          Notifications.success("Required action's priority raised");
          setupRequiredActionsForm();
        },
      );
    };

    $scope.lowerPriority = (action) => {
      RequiredActionLowerPriority.save(
        { realm: realm.realm, alias: action.alias },
        () => {
          Notifications.success("Required action's priority lowered");
          setupRequiredActionsForm();
        },
      );
    };

    $scope.register = () => {
      var controller = ($scope, $modalInstance) => {
        $scope.unregisteredRequiredActions = unregisteredRequiredActions;
        $scope.selected = {
          selected: $scope.unregisteredRequiredActions[0],
        };
        $scope.ok = () => {
          $modalInstance.close();
          RegisterRequiredAction.save(
            { realm: realm.realm },
            $scope.selected.selected,
            () => {
              $route.reload();
            },
          );
        };
        $scope.cancel = () => {
          $modalInstance.dismiss('cancel');
        };
      };
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/unregistered-required-action-selector.html`,
        controller: controller,
        resolve: {},
      });
    };

    setupRequiredActionsForm();
  },
);

module.controller(
  'AuthenticationConfigCtrl',
  (
    $scope,
    realm,
    flow,
    configType,
    config,
    AuthenticationConfig,
    Notifications,
    Dialog,
    $location,
    ComponentUtils,
  ) => {
    $scope.realm = realm;
    $scope.flow = flow;
    $scope.configType = configType;
    $scope.create = false;
    $scope.config = angular.copy(config);
    $scope.changed = false;

    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.$watch(
      'config',
      () => {
        if (!angular.equals($scope.config, config)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.save = () => {
      var configCopy = angular.copy($scope.config);
      ComponentUtils.convertAllListValuesToMultivaluedString(
        configType.properties,
        configCopy.config,
      );

      AuthenticationConfig.update(
        {
          realm: realm.realm,
          config: config.id,
        },
        configCopy,
        () => {
          $scope.changed = false;
          config = angular.copy($scope.config);
          $location.url(
            `/realms/${realm.realm}/authentication/flows/${flow.id}/config/${configType.providerId}/${config.id}`,
          );
          Notifications.success('Your changes have been saved.');
        },
      );
    };

    $scope.reset = () => {
      $scope.config = angular.copy(config);
      $scope.changed = false;
    };

    $scope.cancel = () => {
      //$location.url("/realms");
      window.history.back();
    };

    $scope.remove = () => {
      Dialog.confirmDelete($scope.config.alias, 'config', () => {
        AuthenticationConfig.remove(
          { realm: realm.realm, config: $scope.config.id },
          () => {
            Notifications.success('The config has been deleted.');
            $location.url(
              `/realms/${realm.realm}/authentication/flows/${flow.id}`,
            );
          },
        );
      });
    };
  },
);

module.controller(
  'AuthenticationConfigCreateCtrl',
  (
    $scope,
    realm,
    flow,
    configType,
    execution,
    AuthenticationExecutionConfig,
    Notifications,
    _Dialog,
    $location,
    ComponentUtils,
  ) => {
    $scope.realm = realm;
    $scope.flow = flow;
    $scope.create = true;
    $scope.configType = configType;

    var defaultConfig = {};
    if (configType && Array.isArray(configType.properties)) {
      for (var i = 0; i < configType.properties.length; i++) {
        var property = configType.properties[i];
        if (property?.name) {
          defaultConfig[property.name] = property.defaultValue;
        }
      }
    }

    $scope.config = { config: defaultConfig };

    $scope.$watch(
      () => $location.path(),
      () => {
        $scope.path = $location.path().substring(1).split('/');
      },
    );

    $scope.save = () => {
      var configCopy = angular.copy($scope.config);
      ComponentUtils.convertAllListValuesToMultivaluedString(
        configType.properties,
        configCopy.config,
      );

      AuthenticationExecutionConfig.save(
        {
          realm: realm.realm,
          execution: execution,
        },
        configCopy,
        (_data, headers) => {
          var l = headers().location;
          var id = l.substring(l.lastIndexOf('/') + 1);
          var url = `/realms/${realm.realm}/authentication/flows/${flow.id}/config/${configType.providerId}/${id}`;
          console.log(`redirect url: ${url}`);
          $location.url(url);
          Notifications.success('Config has been created.');
        },
      );
    };

    $scope.cancel = () => {
      //$location.url("/realms");
      window.history.back();
    };
  },
);

module.controller(
  'ClientInitialAccessCtrl',
  (
    $scope,
    realm,
    clientInitialAccess,
    ClientInitialAccess,
    Dialog,
    Notifications,
    $route,
    _$location,
  ) => {
    $scope.realm = realm;
    $scope.clientInitialAccess = clientInitialAccess;

    $scope.remove = (id) => {
      Dialog.confirmDelete(id, 'initial access token', () => {
        ClientInitialAccess.remove({ realm: realm.realm, id: id }, () => {
          Notifications.success('The initial access token was deleted.');
          $route.reload();
        });
      });
    };
  },
);

module.controller(
  'ClientInitialAccessCreateCtrl',
  (
    $scope,
    realm,
    ClientInitialAccess,
    TimeUnit,
    Dialog,
    $location,
    $translate,
  ) => {
    $scope.expirationUnit = 'Days';
    $scope.expiration = TimeUnit.toUnit(0, $scope.expirationUnit);
    $scope.count = 1;
    $scope.realm = realm;

    $scope.save = () => {
      var expiration = TimeUnit.toSeconds(
        $scope.expiration,
        $scope.expirationUnit,
      );
      ClientInitialAccess.save(
        {
          realm: realm.realm,
        },
        { expiration: expiration, count: $scope.count },
        (data) => {
          console.debug(data);
          $scope.id = data.id;
          $scope.token = data.token;
        },
      );
    };

    $scope.cancel = () => {
      $location.url(
        `/realms/${realm.realm}/client-registration/client-initial-access`,
      );
    };

    $scope.done = () => {
      var btns = {
        ok: {
          label: $translate.instant('continue'),
          cssClass: 'btn btn-primary',
        },
        cancel: {
          label: $translate.instant('cancel'),
          cssClass: 'btn btn-default',
        },
      };

      var title = $translate.instant('initial-access-token.confirm.title');
      var message = $translate.instant('initial-access-token.confirm.text');
      Dialog.open(title, message, btns, () => {
        $location.url(
          `/realms/${realm.realm}/client-registration/client-initial-access`,
        );
      });
    };
  },
);

module.controller(
  'ClientRegPoliciesCtrl',
  (
    $scope,
    realm,
    clientRegistrationPolicyProviders,
    policies,
    Dialog,
    Notifications,
    Components,
    $route,
    $location,
  ) => {
    $scope.realm = realm;
    $scope.providers = clientRegistrationPolicyProviders;
    $scope.anonPolicies = [];
    $scope.authPolicies = [];
    for (var i = 0; i < policies.length; i++) {
      var policy = policies[i];
      if (policy.subType === 'anonymous') {
        $scope.anonPolicies.push(policy);
      } else if (policy.subType === 'authenticated') {
        $scope.authPolicies.push(policy);
      } else {
        throw 'subType is required for clientRegistration policy component!';
      }
    }

    $scope.addProvider = (authType, provider) => {
      console.log(
        `Add provider: authType ${authType}, providerId: ${provider.id}`,
      );
      $location.url(
        `/realms/${realm.realm}/client-registration/client-reg-policies/create/${authType}/${provider.id}`,
      );
    };

    $scope.getInstanceLink = (instance) =>
      `/realms/${realm.realm}/client-registration/client-reg-policies/${instance.providerId}/${instance.id}`;

    $scope.removeInstance = (instance) => {
      Dialog.confirmDelete(instance.name, 'client registration policy', () => {
        Components.remove(
          {
            realm: realm.realm,
            componentId: instance.id,
          },
          () => {
            $route.reload();
            Notifications.success('The policy has been deleted.');
          },
        );
      });
    };
  },
);

module.controller(
  'ClientRegPolicyDetailCtrl',
  (
    $scope,
    realm,
    clientRegistrationPolicyProviders,
    instance,
    _Dialog,
    Notifications,
    Components,
    ComponentUtils,
    $route,
    $location,
    $translate,
  ) => {
    $scope.realm = realm;
    $scope.instance = instance;
    $scope.providerTypes = clientRegistrationPolicyProviders;

    for (let i = 0; i < $scope.providerTypes.length; i++) {
      const providerType = $scope.providerTypes[i];
      if (providerType.id === instance.providerId) {
        $scope.providerType = providerType;
        break;
      }
    }

    $scope.create = !$scope.instance.name;

    function toDefaultValue(configProperty) {
      if (
        configProperty.type === 'MultivaluedString' ||
        configProperty.type === 'MultivaluedList'
      ) {
        if (configProperty.defaultValue) {
          return configProperty.defaultValue;
        } else {
          return [];
        }
      }

      if (configProperty.defaultValue) {
        return [configProperty.defaultValue];
      } else {
        return [''];
      }
    }

    $translate(`${$scope.instance.providerId}.label`)
      .then((translatedValue) => {
        $scope.headerTitle = translatedValue;
      })
      .catch(() => {
        $scope.headerTitle = $scope.instance.providerId;
      });

    if ($scope.create) {
      $scope.instance.name = '';
      $scope.instance.parentId = realm.id;
      $scope.instance.config = {};

      if ($scope.providerType.properties) {
        for (let i = 0; i < $scope.providerType.properties.length; i++) {
          const configProperty = $scope.providerType.properties[i];
          $scope.instance.config[configProperty.name] =
            toDefaultValue(configProperty);
        }
      }
    }

    if ($scope.providerType.properties) {
      ComponentUtils.addLastEmptyValueToMultivaluedLists(
        $scope.providerType.properties,
        $scope.instance.config,
      );
      ComponentUtils.addMvOptionsToMultivaluedLists(
        $scope.providerType.properties,
      );
    }

    const oldCopy = angular.copy($scope.instance);
    $scope.changed = false;

    $scope.$watch(
      'instance',
      () => {
        if (!angular.equals($scope.instance, oldCopy)) {
          $scope.changed = true;
        }
      },
      true,
    );

    $scope.reset = () => {
      $scope.create ? window.history.back() : $route.reload();
    };

    $scope.hasValidValues = () => $scope.changed && $scope.instance.name;

    $scope.save = () => {
      $scope.changed = false;
      if ($scope.create) {
        Components.save(
          { realm: realm.realm },
          $scope.instance,
          (_data, headers) => {
            var l = headers().location;
            var id = l.substring(l.lastIndexOf('/') + 1);
            $location.url(
              `/realms/${realm.realm}/client-registration/client-reg-policies/${$scope.instance.providerId}/${id}`,
            );
            Notifications.success('The policy has been created.');
          },
        );
      } else {
        Components.update(
          { realm: realm.realm, componentId: instance.id },
          $scope.instance,
          () => {
            $route.reload();
            Notifications.success('The policy has been updated.');
          },
        );
      }
    };
  },
);

module.controller(
  'RealmImportCtrl',
  ($scope, realm, $route, Notifications, $modal, $resource) => {
    $scope.rawContent = {};
    $scope.fileContent = {
      enabled: true,
    };
    $scope.changed = false;
    $scope.files = [];
    $scope.realm = realm;
    $scope.overwrite = false;
    $scope.skip = false;
    $scope.importUsers = false;
    $scope.importGroups = false;
    $scope.importClients = false;
    $scope.importIdentityProviders = false;
    $scope.importRealmRoles = false;
    $scope.importClientRoles = false;
    $scope.ifResourceExists = 'FAIL';
    $scope.isMultiRealm = false;
    $scope.results = {};
    $scope.currentPage = 0;
    var pageSize = 15;

    var oldCopy = angular.copy($scope.fileContent);

    $scope.importFile = ($fileContent) => {
      var parsed;
      try {
        parsed = JSON.parse($fileContent);
      } catch (_e) {
        Notifications.error('Unable to parse JSON file.');
        return;
      }

      $scope.rawContent = angular.copy(parsed);
      if (Array.isArray($scope.rawContent) && $scope.rawContent.length > 0) {
        if ($scope.rawContent.length > 1) $scope.isMultiRealm = true;
        $scope.fileContent = $scope.rawContent[0];
      } else {
        $scope.fileContent = $scope.rawContent;
      }

      $scope.importing = true;
      setOnOffSwitchDefaults();
      $scope.results = {};
      if (!$scope.hasResources()) {
        $scope.nothingToImport();
      }
    };

    $scope.hasResults = () =>
      Object.keys($scope.results).length > 0 &&
      $scope.results.results !== undefined &&
      $scope.results.results.length > 0;

    $scope.resultsPage = () => {
      if (!$scope.hasResults()) return {};
      return $scope.results.results.slice(startIndex(), endIndex());
    };

    function startIndex() {
      return pageSize * $scope.currentPage;
    }

    function endIndex() {
      var length = $scope.results.results.length;
      var endIndex = startIndex() + pageSize;
      if (endIndex > length) endIndex = length;
      return endIndex;
    }

    function setOnOffSwitchDefaults() {
      $scope.importUsers = $scope.hasArray('users');
      $scope.importGroups = $scope.hasArray('groups');
      $scope.importClients = $scope.hasArray('clients');
      $scope.importIdentityProviders = $scope.hasArray('identityProviders');
      $scope.importRealmRoles = $scope.hasRealmRoles();
      $scope.importClientRoles = $scope.hasClientRoles();
    }

    $scope.setFirstPage = () => {
      $scope.currentPage = 0;
    };

    $scope.setNextPage = () => {
      $scope.currentPage++;
    };

    $scope.setPreviousPage = () => {
      $scope.currentPage--;
    };

    $scope.hasNext = () => {
      if (!$scope.hasResults()) return false;
      var length = $scope.results.results.length;
      //console.log('length=' + length);
      var endIndex = startIndex() + pageSize;
      //console.log('endIndex=' + endIndex);
      return length > endIndex;
    };

    $scope.hasPrevious = () => {
      if (!$scope.hasResults()) return false;
      return $scope.currentPage > 0;
    };

    $scope.viewImportDetails = () => {
      $modal.open({
        templateUrl: `${resourceUrl}/partials/modal/view-object.html`,
        controller: 'ObjectModalCtrl',
        resolve: {
          object: () => $scope.fileContent,
        },
      });
    };

    $scope.hasArray = (section) =>
      $scope.fileContent !== 'undefined' &&
      Object.hasOwn($scope.fileContent, section) &&
      Array.isArray($scope.fileContent[section]) &&
      $scope.fileContent[section].length > 0;

    $scope.hasRealmRoles = () =>
      $scope.hasRoles() &&
      Object.hasOwn($scope.fileContent.roles, 'realm') &&
      Array.isArray($scope.fileContent.roles.realm) &&
      $scope.fileContent.roles.realm.length > 0;

    $scope.hasRoles = () =>
      $scope.fileContent !== 'undefined' &&
      Object.hasOwn($scope.fileContent, 'roles') &&
      $scope.fileContent.roles !== 'undefined';

    $scope.hasClientRoles = () =>
      $scope.hasRoles() &&
      Object.hasOwn($scope.fileContent.roles, 'client') &&
      Object.keys($scope.fileContent.roles.client).length > 0;

    $scope.itemCount = (section) => {
      if (!$scope.importing) return 0;
      if ($scope.hasRealmRoles() && section === 'roles.realm')
        return $scope.fileContent.roles.realm.length;
      if ($scope.hasClientRoles() && section === 'roles.client')
        return clientRolesCount($scope.fileContent.roles.client);

      if (!Object.hasOwn($scope.fileContent, section)) return 0;

      return $scope.fileContent[section].length;
    };

    clientRolesCount = (clientRoles) => {
      var total = 0;
      for (var clientName in clientRoles) {
        total += clientRoles[clientName].length;
      }
      return total;
    };

    $scope.hasResources = () =>
      ($scope.importUsers && $scope.hasArray('users')) ||
      ($scope.importGroups && $scope.hasArray('groups')) ||
      ($scope.importClients && $scope.hasArray('clients')) ||
      ($scope.importIdentityProviders &&
        $scope.hasArray('identityProviders')) ||
      ($scope.importRealmRoles && $scope.hasRealmRoles()) ||
      ($scope.importClientRoles && $scope.hasClientRoles());

    $scope.nothingToImport = () => {
      Notifications.error('No resources specified to import.');
    };

    $scope.$watch(
      'fileContent',
      () => {
        if (!angular.equals($scope.fileContent, oldCopy)) {
          $scope.changed = true;
        }
        setOnOffSwitchDefaults();
      },
      true,
    );

    $scope.successMessage = () => {
      var message = `${$scope.results.added} records added. `;
      if ($scope.ifResourceExists === 'SKIP') {
        message += `${$scope.results.skipped} records skipped.`;
      }
      if ($scope.ifResourceExists === 'OVERWRITE') {
        message += `${$scope.results.overwritten} records overwritten.`;
      }
      return message;
    };

    $scope.save = () => {
      var json = angular.copy($scope.fileContent);
      json.ifResourceExists = $scope.ifResourceExists;
      if (!$scope.importUsers) delete json.users;
      if (!$scope.importGroups) delete json.groups;
      if (!$scope.importIdentityProviders) delete json.identityProviders;
      if (!$scope.importClients) delete json.clients;

      if (Object.hasOwn(json, 'roles')) {
        if (!$scope.importRealmRoles) delete json.roles.realm;
        if (!$scope.importClientRoles) delete json.roles.client;
      }

      var importFile = $resource(
        `${authUrl}/admin/realms/${realm.realm}/partialImport`,
      );
      $scope.results = importFile.save(
        json,
        () => {
          Notifications.success($scope.successMessage());
        },
        (error) => {
          if (error.data.errorMessage) {
            Notifications.error(error.data.errorMessage);
          } else {
            Notifications.error('Unexpected error during import');
          }
        },
      );
    };

    $scope.reset = () => {
      $route.reload();
    };
  },
);

module.controller(
  'RealmExportCtrl',
  ($scope, realm, $http, $httpParamSerializer, Notifications, Dialog) => {
    $scope.realm = realm;
    $scope.exportGroupsAndRoles = false;
    $scope.exportClients = false;

    $scope.export = () => {
      if ($scope.exportGroupsAndRoles || $scope.exportClients) {
        Dialog.confirm(
          'Export',
          'This operation may make server unresponsive for a while.\n\nAre you sure you want to proceed?',
          download,
        );
      } else {
        download();
      }
    };

    function download() {
      var exportUrl = `${authUrl}/admin/realms/${realm.realm}/partial-export`;
      var params = {};
      if ($scope.exportGroupsAndRoles) {
        params['exportGroupsAndRoles'] = true;
      }
      if ($scope.exportClients) {
        params['exportClients'] = true;
      }
      if (Object.keys(params).length > 0) {
        exportUrl += `?${$httpParamSerializer(params)}`;
      }
      $http
        .post(exportUrl)
        .then((response) => {
          var download = angular.fromJson(response.data);
          download = angular.toJson(download, true);
          saveAs(
            new Blob([download], { type: 'application/json' }),
            'realm-export.json',
          );
        })
        .catch(() => {
          Notifications.error('Sorry, something went wrong.');
        });
    }
  },
);
