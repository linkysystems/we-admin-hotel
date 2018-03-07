/**
 * Hodel card model
 */

import DS from 'ember-data';

export default DS.Model.extend({
  fullName: DS.attr('string'),
  gender: DS.attr('string'),
  birthdate: DS.attr('date'),
  ocupationJob: DS.attr('string'),
  travelDocument: DS.attr('string'),
  type: DS.attr('string'),
  issuingCountry: DS.attr('string'),
  homeAddress: DS.attr('string'),
  zipCode: DS.attr('string'),
  phoneNumber: DS.attr('string'),
  city: DS.attr('string'),
  state: DS.attr('string'),
  country: DS.attr('string'),
  nationality: DS.attr('string'),
  cpf: DS.attr('string'),

  ciCompany: DS.attr('string'),
  ciOcupation: DS.attr('string'),
  ciSmoke: DS.attr('boolean'),
  ciAddress: DS.attr('string'),
  ciZipCode: DS.attr('string'),
  ciCity: DS.attr('string'),
  ciState: DS.attr('string'),
  ciCountry: DS.attr('string'),
  ciPhoneNumber: DS.attr('string'),

  accConditions: DS.attr('boolean', {
    defaultValue: true
  }),

  creator: DS.belongsTo('user', {
    async: true
  }),
  createdAt: DS.attr('date'),
  updatedAt: DS.attr('date'),

  linkPermanent: DS.attr('string')
});