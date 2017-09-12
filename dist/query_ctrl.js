'use strict';

System.register(['./modal_ctrl', './constants', 'app/plugins/sdk', 'lodash'], function (_export, _context) {
  "use strict";

  var QueryType, QueryCtrl, _, _createClass, OpenNMSQueryCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  return {
    setters: [function (_modal_ctrl) {}, function (_constants) {
      QueryType = _constants.QueryType;
    }, function (_appPluginsSdk) {
      QueryCtrl = _appPluginsSdk.QueryCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('OpenNMSQueryCtrl', OpenNMSQueryCtrl = function (_QueryCtrl) {
        _inherits(OpenNMSQueryCtrl, _QueryCtrl);

        function OpenNMSQueryCtrl($rootScope, $scope, $injector, $q, $modal) {
          _classCallCheck(this, OpenNMSQueryCtrl);

          var _this = _possibleConstructorReturn(this, (OpenNMSQueryCtrl.__proto__ || Object.getPrototypeOf(OpenNMSQueryCtrl)).call(this, $scope, $injector));

          _this.types = QueryType;

          _this.error = _this.validateTarget();
          _this.$rootScope = $rootScope;
          _this.$q = $q;
          _this.$modal = $modal;
          return _this;
        }

        _createClass(OpenNMSQueryCtrl, [{
          key: 'openNodeSelectionModal',
          value: function openNodeSelectionModal() {
            var self = this;
            this.showSelectionModal("nodes", {
              '#': 'id',
              'Label': 'label',
              'Foreign ID': 'foreignId',
              'sysName': 'sysName'
            }, function (query) {
              return self.datasource.searchForNodes(query).then(function (results) {
                return {
                  'count': results.data.count,
                  'totalCount': results.data.totalCount,
                  'rows': results.data.node
                };
              });
            }, function (node) {
              if (!_.isUndefined(node.foreignId) && !_.isNull(node.foreignId) && !_.isUndefined(node.foreignSource) && !_.isNull(node.foreignSource)) {
                // Prefer fs:fid
                self.target.nodeId = node.foreignSource + ":" + node.foreignId;
              } else {
                // Fallback to node id
                self.target.nodeId = node.id;
              }
              self.targetBlur();
            });
          }
        }, {
          key: 'openResourceSelectionModal',
          value: function openResourceSelectionModal() {
            var self = this;

            function filterResources(resources, query) {
              var filteredResources = resources;
              if (query.length >= 1) {
                query = query.toLowerCase();
                filteredResources = _.filter(resources, function (resource) {
                  return resource.key.indexOf(query) >= 0;
                });
              }

              // Limit the results - it takes along time to render if there are too many
              var totalCount = filteredResources.length;
              filteredResources = _.take(filteredResources, self.datasource.searchLimit);

              return {
                'count': filteredResources.length,
                'totalCount': totalCount,
                'rows': filteredResources
              };
            }

            self.nodeResources = undefined;
            this.showSelectionModal("resources", {
              'Label': 'label',
              'Name': 'name'
            }, function (query) {
              if (self.nodeResources !== undefined) {
                var deferred = self.$q.defer();
                deferred.resolve(filterResources(self.nodeResources, query));
                return deferred.promise;
              }

              return self.datasource.getResourcesWithAttributesForNode(self.target.nodeId).then(function (resources) {
                // Compute a key for more efficient searching
                _.each(resources, function (resource) {
                  resource.key = resource.label.toLowerCase() + resource.name.toLowerCase();
                });
                // Sort the list once
                self.nodeResources = _.sortBy(resources, function (resource) {
                  return resource.label;
                });
                // Filter
                return filterResources(self.nodeResources, query);
              });
            }, function (resource) {
              // Exclude the node portion of the resource id
              var re = /node(Source)?\[.*?]\.(.*)$/;
              var match = re.exec(resource.id);
              self.target.resourceId = match[2];
              self.targetBlur();
            });
          }
        }, {
          key: 'openAttributeSelectionModal',
          value: function openAttributeSelectionModal() {
            var self = this;
            this.showSelectionModal("attributes", {
              'Name': 'name'
            }, function (query) {
              return self.datasource.suggestAttributes(self.target.nodeId, self.target.resourceId, query).then(function (attributes) {
                var namedAttributes = [];
                _.each(attributes, function (attribute) {
                  namedAttributes.push({ 'name': attribute });
                });

                return {
                  'count': namedAttributes.length,
                  'totalCount': namedAttributes.length,
                  'rows': namedAttributes
                };
              });
            }, function (attribute) {
              self.target.attribute = attribute.name;
              self.targetBlur();
            });
          }
        }, {
          key: 'openFilterSelectionModal',
          value: function openFilterSelectionModal() {
            var self = this;
            this.showSelectionModal("filters", {
              'Name': 'name',
              'Description': 'description',
              'Backend': 'backend'
            }, function () {
              return self.datasource.getAvailableFilters().then(function (results) {
                return {
                  'count': results.data.length,
                  'totalCount': results.data.length,
                  'rows': results.data
                };
              });
            }, function (filter) {
              self.target.filter = filter;
              self.targetBlur();
            });
          }
        }, {
          key: 'showSelectionModal',
          value: function showSelectionModal(label, columns, search, callback) {
            var scope = this.$rootScope.$new();

            scope.label = label;
            scope.columns = columns;
            scope.search = search;

            scope.result = this.$q.defer();
            scope.result.promise.then(callback);

            var modal = this.$modal({
              template: 'public/plugins/opennms-datasource/partials/modal.selection.html',
              persist: false,
              show: false,
              scope: scope,
              keyboard: false
            });
            this.$q.when(modal).then(function (modalEl) {
              modalEl.modal('show');
            });
          }
        }, {
          key: 'targetBlur',
          value: function targetBlur() {
            this.error = this.validateTarget();
            this.refresh();
          }
        }, {
          key: 'validateTarget',
          value: function validateTarget() {
            if (this.target.type === QueryType.Attribute) {
              if (!this.target.nodeId) {
                return "You must supply a node id.";
              } else if (!this.target.resourceId) {
                return "You must supply a resource id.";
              } else if (!this.target.attribute) {
                return "You must supply an attribute.";
              }
            } else if (this.target.type === QueryType.Expression) {
              if (!this.target.label) {
                return "You must supply a label.";
              } else if (!this.target.expression) {
                return "You must supply an expression.";
              }
            } else if (this.target.type === QueryType.Filter) {
              if (!this.target.filter) {
                return "You must select a filter.";
              }
            } else {
              return "Invalid type.";
            }

            return undefined;
          }
        }, {
          key: 'getCollapsedText',
          value: function getCollapsedText() {
            if (this.target.type === QueryType.Attribute) {
              return "Attribute: " + this.target.attribute;
            } else if (this.target.type === QueryType.Expression) {
              return "Expression: " + this.target.label;
            } else if (this.target.type === QueryType.Filter) {
              return "Filter: " + this.target.filter.name;
            } else {
              return "<Incomplete>";
            }
          }
        }]);

        return OpenNMSQueryCtrl;
      }(QueryCtrl));

      _export('OpenNMSQueryCtrl', OpenNMSQueryCtrl);

      OpenNMSQueryCtrl.templateUrl = 'partials/query.editor.html';
    }
  };
});
//# sourceMappingURL=query_ctrl.js.map
