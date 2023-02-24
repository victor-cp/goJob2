const { DataTypes, Sequelize } = require("sequelize");

const serviceModel = (sequelize) => {
  // defino el modelo
  sequelize.define(
    "Service",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tittle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        defaultValue: "pendiente",
        validate: {
          isIn: [["pendiente", "proceso", "terminado"]],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      presupuesto: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // stripepriceId:{
      //   type: DataTypes.STRING,
      //   //allowNull: false
      // },
      score: {
        type: DataTypes.INTEGER,
        default: 0,
      },
      fecha_publicacion: {
        type: DataTypes.DATEONLY,
        defaultValue: sequelize.fn('NOW'),
        allowNull: false   
      },
      
      //ubicacion
      provincia: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ciudad: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      direccion: {
          type: DataTypes.STRING,
      },
      priceIdStripe:{
        type: DataTypes.STRING,
        allowNull: true
      },
      productIdStripe :{
        type: DataTypes.STRING,
        allowNull: true
      },

    },
    { timestamps: false }
  );
};

module.exports = serviceModel;
