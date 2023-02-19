const {Job, Service, User} = require("../connection/db")
const bcrypt = require("bcrypt");
const {uploadImage} = require("../services/cloudinary")
const fs = require("fs-extra")


const { 
  getDbUser,
  getUserByID,
  getUserName
 } = require("../controllers/userController");
const { createToken } = require("../services/jwt");

const getAllUser = async (req, res) => {
  let {name} = req.query
  let page = Number(req.query.page || 1)
  let page_size = Number(req.query.page_size || 15)

  let userTotal
  try {
    if(name){
      userTotal = await getUserName(name, page, page_size)
    }else{
      userTotal = await getDbUser(page, page_size);
    }

    if(!userTotal.result.length) throw Error("Sin resultados")

   

    //si todo salio bien
    return res.status(200).json({
      status: "success",
      message: "Extraccion exitosa",
      ...userTotal

    });

  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: error.message
    });
  }
};


const getUserID = async (req, res) => {
  const id = req.params.id;
  let userTotal;

  try {
    if (!id) throw Error("Mising data")

    //extraemos datos y comprobamos si hay datos
    userTotal = await getUserByID(id);
    
   
    //si todo salio bien
    return res.status(200).json({
      status: "success",
      message: "Extraccion exitosa",
      result: userTotal
    });

  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: error.message
    });
  }

};



const createUser = async (req, res) => {
  let newUser = req.body.user;
  let idJobs = req.body.jobs;
  let error = false;

  try {
    if(!newUser) throw new Error("Mising data");
    
    if(req.files?.image){
      let pwd = await bcrypt.hash(newUser.password, 10);
      newUser.password = pwd;
      const result = await uploadImage(req.files.image.tempFilePath);
      if(result.error) error = true; // Si se produce un error al cargar la imagen, establecemos la variable de estado en verdadero
      newUser.imageurl = result.secure_url;
      newUser.imagePublicId = result.public_id;

      await fs.unlink(req.files.image.tempFilePath) // borra el archivo despues de subirlo a cloudinary

    } else {
      let pwd = await bcrypt.hash(newUser.password, 10);
      newUser.password = pwd;
      newUser.imageurl = "sin foto";
      newUser.imagePublicId = "sin foto";
    }

    let userCreated = await User.create(newUser);
    delete userCreated.dataValues.password;

    // Verificar que los JobIds existen en la base de datos
    // const jobsData = await Job.findAll({ where: { id: idJobs }});
    // if (jobs.length !== idJjobsDataobs.length) {
    //   throw new Error("Uno o más JobIds no existen en la base de datos");
    // }

    //lo comente por que trai conflictos con mi merge: fray

    await userCreated.addJobs(idJobs);
    // agregar nuevo usuario a Jobs

    return res.status(200).json({
      status: "success",
      message: "Usuario creado correctamente",
      result: userCreated,
      jobs: "Jobs agregados correctamente",
      error: error // Agregamos la variable de estado a la respuesta
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      message: error.message,
      error: error || true // Establecemos la variable de estado en verdadero si se produce un error en cualquier lugar del bloque try-catch
    });
  }
};



const login = async(req, res)=>{
  const userLogin = req.body
  try {
    if(!userLogin.user || !userLogin.password) throw new Error("Mising data")
    //verificamos si existe el usuario
    let resultUser = await User.findOne({
      where: {user: userLogin.user},
      include: [
        {
          model: User,
          as: 'friends',
          attributes: { exclude: ['password', 'role'] },
          through: { 
            attributes:[]
          }
        },
        {
          model: Job,
          through: { 
            attributes:[]
          }
        },
        {
          model: Service,
          as: "myServices",
          include:[         
            {
              model: User,
              as: "postulantes",
              attributes:["id", "firstName", "lastName", "user", "email", "phone"],
              through: { 
                attributes:[]
              },

            },
            {
              model: User,
              as: "trabajadorId",
              attributes:["id", "firstName", "lastName", "user", "email", "phone"],
              through: { 
                attributes:[]
              }
            }
          ]
        },
        {
          model: Service,
          as: "myTrabajos",
          through: { 
            attributes:[]
          }
        }   
  
      ],
    })
    if(!resultUser) throw new Error("El usuario no existe")
  
    //comprobamos contraseña
    let pwd = bcrypt.compareSync(userLogin.password, resultUser.password);
    if(!pwd)throw new Error("Contraseña incorrecta")
  
    //creamos token
    let token = createToken(resultUser.dataValues)
  
    //eliminamos contraseña
    delete resultUser.dataValues.password


    //si todo salio bien
    return res.status(200).json({
      status: "success",
      message: "Login correctamente",
      result: resultUser,
      token: token
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}
//job
const addJob = async(req, res)=>{
  let idUser = req.user.id
  let idJob = req.body.id

  try {
    if(!idJob) throw new Error("Mising data")

    //traemos el model para agregar
    let user = await User.findOne({where: {id: idUser}})
    await user.addJob(idJob)

    // let job = await Job.findOne({where: {id: idJob}})
    // await job.addUser(idUser)

    return res.status(400).json({
      status: "success",
      message: "Job agregado correctamente",
      idUser,
      idJob,
      user,
  
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

const deleteJob = async(req, res)=>{
  let idUser = req.user.id
  let idJob = req.body.id

  try {
    if(!idJob) throw new Error("Mising data")

    //traemos el model para agregar
    let user = await User.findOne({where: {id: idUser}})
    await user.removeJob(idJob)

    return res.status(400).json({
      status: "success",
      message: "Job eliminado correctamente"
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}


const decifrarToken = async(req, res)=>{

  return res.status(200).json({
    status: "success",
    token: req.user
  })
}
//amigos
const addFriend = async(req, res)=>{
  //extraemos datos
  let idUser = req.user.id
  let idFriend = req.body.idFriend
  
  try {
    if(!idUser || !idFriend) throw new Error("Mising data")

    let user = await User.findOne({where: {id: idUser}})
    await user.addFriend(idFriend)

    return res.status(200).json({
      status: "success",
      message: `Amigo "${user.dataValues.user}" agregado correctamente`,
    })
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    })
  }
  
}

const deleteFriend = async(req, res)=>{
  //extraemos datos
  let idUser = req.user.id
  let idFriend = req.body.idFriend
  
  try {
    if(!idUser || !idFriend) throw new Error("Mising data")

    let user = await User.findOne({where: {id: idUser}})
    await user.removeFriend(idFriend)

    return res.status(200).json({
      status: "success",
      message: `Amigo "${user.dataValues.user}" eliminado correctamente`,
    })
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    })
  }
}

const getFriends = async(req, res)=>{
  let idUser = req.user.id

  try {
    let user = await User.findOne({
      where: {id: idUser},
      include: {
        model: User,
        as: 'friends',
        attributes: { exclude: ['password', 'role'] },
        through: { 
          attributes:[]
        }
      }
    })

    if(!user.dataValues.friends.length){
      return res.status(200).json({
        status: "success",
        message: `No se encontraron amigos de este usuario`,
        result: user.dataValues.friends
      })
    }


    return res.status(200).json({
      status: "success",
      message: `Extraccion de amigos exitosa`,
      result: user.dataValues.friends
    })
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    })
  }
}
//service
const createServer = async (req, res) => {
  let newService = req.body;
  let idUser = req.user.id;
  try {
    let getUser = await User.findOne({ where: { id: idUser } });
    //agregamos servicio
    let service = await await getUser.createMyService(newService);

    //vinculamos el servicio con los jobs
    let addJob = await service.addJobs(newService.jobs)


    return res.status(200).json({
      status: "success",
      message: "Servicio creado correctamente",
      service: service,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const getAllService = async (req, res) => {
  let idUser = req.user.id;
  try {
    let getUser = await User.findOne({ where: { id: idUser } });
    let allServices = await getUser.getMyServices({
      attributes: { exclude: ['UserId'] },
      include: [
        {
          model: Job,
          through: { 
            attributes:[]
          }
        },
        {
          model: User,
          as:"userId",
          attributes:["id", "firstName", "lastName", "user", "email", "phone"]

        },
        {
          model: User,
          as: "postulantes",
          attributes:["id", "firstName", "lastName", "user", "email", "phone"],
          through: { 
            attributes:[]
          }
        }
      ]
    })

    return res.status(400).json({
      status: "error",
      message: "Extraccion exitosa",
      result: allServices
    })

  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    })
  }
};

const actualizarService = async(req, res)=>{
  let putService = req.body.service;
  let idUser = req.user.id;
  let idService = Number(req.params.idService)
  let putJobs = req.body.jobs

  try {
    //actualizamos datos de service
    let service = await Service.update(
      putService, 
      {
        where: {
          id: idService,
          UserId: idUser  
        }
      }
    )
    //actualizamos relacion Service Jobs
    if(putJobs.length){
      let actService = await Service.findOne({where: {id: idService}})
      await actService.setJobs(putJobs)
    }



    return res.status(200).json({
      status: "success",
      message: "Se actualizo correctamente",  
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

const deleteService = async (req, res)=>{
  let idUser = req.user.id;
  let idService = Number(req.params.idService)

  try {
    let deleteService = await Service.destroy({
      where: {id: idService, UserId: idUser}
    })

    //si todo sale bien
    return res.status(200).json({
      status: "success",
      message: "Service Eliminado correctamente"
    });


  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
  

}

const postularService = async (req, res)=>{
  let idUser = req.user.id
  let idService = req.params.idService

  try {
    if (isNaN(idService)){
      return res.status(400).json({
        status: "error",
        message: "Datos de entrada invalidos"
      });
    }

    const service = await Service.findOne({where: {id: idService}});

    let postulate = await service.addPostulante(idUser)

    //si todo salio bien
    return res.status(200).json({
      status: "success",
      message: "Postulo correctamente ",
      idPostulantes: service.dataValues.idPostulantes,
    });

  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}

const deletePostuleService = async (req, res)=>{
  let idUser = req.user.id
  let idService = req.params.idService

  try {
    if (isNaN(idService)){
      return res.status(400).json({
        status: "error",
        message: "Datos de entrada invalidos"
      });
    }

    const service = await Service.findByPk(idService);

    let postulate = await service.removePostulante(idUser)

    //si todo salio bien
    return res.status(200).json({
      status: "success",
      message: "Elimino la postulacion correctamente "
    });

  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
      postulate
    });
  }
}

const elegirTrabajador = async (req, res)=>{
  let idUser = req.user.id

  let idTrabajador = Number(req.query.trabajador)
  let idService = Number(req.query.service)

  try {
    if(!idTrabajador || !idService)throw Error("Mising data")

    //elegimos el trabajador
    let service = await Service.findOne({where: {id: idService, UserId: idUser}})
    let addTraba = await service.addTrabajadorId(idTrabajador)

    //eliminamos al trabajdor de la lista postulantes
    let deletePostu = await service.removePostulante(idTrabajador)

    //actualizamos el state del service
    let actStateSer = await Service.update(
      {
        state: "proceso"
      },
      {
        where: {id: idService, UserId: idUser}
      }
    )



    return res.status(400).json({
      status: "success",
      message: "Pruebaaaa",
      service,
      idTrabajador,
      idService,
      idUser,
      addTraba: addTraba
    })
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message
    })
  }
}

//rating
const createRating = async(req, res)=>{
  let idUser = req.user.id
  let idUserCalificado = Number(req.query.id)
  let rating = Number(req.query.rating)

  try {
    const user1 = await User.findByPk(idUser);

    const newRating = await user1.rateUser(idUserCalificado, rating);

    //si todo sale bien
    return res.status(400).json({
      status: "success",
      message: "Calificacion exitosa",
      newRating
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
}




module.exports = {
  getAllUser,
  getUserID,
  createUser,
  login,
  decifrarToken,
  addFriend,
  deleteFriend,
  addJob,
  deleteJob,
  getFriends,
  getAllService,
  createServer,
  actualizarService,
  deleteService,
  //putUser,
  createRating,
  postularService,
  deletePostuleService,
  elegirTrabajador
};

